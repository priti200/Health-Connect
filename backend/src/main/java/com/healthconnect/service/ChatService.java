package com.healthconnect.service;

import com.healthconnect.dto.*;
import com.healthconnect.entity.*;
import com.healthconnect.repository.AppointmentRepository;
import com.healthconnect.repository.ChatRepository;
import com.healthconnect.repository.MessageRepository;
import com.healthconnect.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatRepository chatRepository, MessageRepository messageRepository,
                      UserRepository userRepository, AppointmentRepository appointmentRepository) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Autowired(required = false)
    public void setMessagingTemplate(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    public ChatResponse createOrGetChat(Long currentUserId, Long participantId) {
        return createOrGetChat(currentUserId, participantId, null, ChatType.GENERAL, null);
    }

    public ChatResponse createOrGetChat(Long currentUserId, Long participantId, Long appointmentId, ChatType chatType, String subject) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
        User participant = userRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));

        // Ensure one is patient and one is doctor
        User patient;
        User doctor;

        if (currentUser.getRole() == UserRole.PATIENT && participant.getRole() == UserRole.DOCTOR) {
            patient = currentUser;
            doctor = participant;
        } else if (currentUser.getRole() == UserRole.DOCTOR && participant.getRole() == UserRole.PATIENT) {
            patient = participant;
            doctor = currentUser;
        } else {
            throw new RuntimeException("Chat can only be created between patient and doctor. Current user role: " + currentUser.getRole() + ", Participant role: " + participant.getRole());
        }

        Chat chat;
        if (appointmentId != null) {
            // Look for appointment-specific chat
            chat = chatRepository.findByParticipantsAndAppointment(patient, doctor, appointmentId)
                    .orElseGet(() -> createNewChat(patient, doctor, appointmentId, chatType, subject));
        } else {
            // Look for general chat
            chat = chatRepository.findByParticipants(patient, doctor)
                    .orElseGet(() -> createNewChat(patient, doctor, null, chatType, subject));
        }

        return convertToChatResponse(chat, currentUser);
    }

    private Chat createNewChat(User patient, User doctor, Long appointmentId, ChatType chatType, String subject) {
        Chat newChat = new Chat();
        newChat.setPatient(patient);
        newChat.setDoctor(doctor);
        newChat.setType(chatType);
        newChat.setSubject(subject);

        if (appointmentId != null) {
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Appointment not found"));
            newChat.setRelatedAppointment(appointment);
        }

        return chatRepository.save(newChat);
    }
    
    public List<ChatResponse> getUserChats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Chat> chats = chatRepository.findByParticipant(user);
        return chats.stream()
                .map(chat -> convertToChatResponse(chat, user))
                .collect(Collectors.toList());
    }
    
    public MessageResponse sendMessage(Long chatId, String content, Long senderId) {
        log.info("Sending message - chatId: {}, senderId: {}, content length: {}", chatId, senderId, content.length());

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        log.info("Chat participants - Patient ID: {}, Doctor ID: {}, Sender ID: {}",
                chat.getPatient().getId(), chat.getDoctor().getId(), senderId);

        // Verify sender is participant in chat
        if (!chat.getPatient().getId().equals(senderId) && !chat.getDoctor().getId().equals(senderId)) {
            log.error("User {} is not a participant in chat {}. Patient: {}, Doctor: {}",
                    senderId, chatId, chat.getPatient().getId(), chat.getDoctor().getId());
            throw new RuntimeException("User is not a participant in this chat");
        }
        
        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(content);
        message.setStatus(MessageStatus.SENT);
        
        message = messageRepository.save(message);
        
        // Update chat timestamp
        chat.setUpdatedAt(message.getCreatedAt());
        chatRepository.save(chat);
        
        return convertToMessageResponse(message);
    }
    
    public List<MessageResponse> getChatMessages(Long chatId, Long userId, int page, int size) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify user is participant in chat
        if (!chat.getPatient().getId().equals(userId) && !chat.getDoctor().getId().equals(userId)) {
            throw new RuntimeException("User is not a participant in this chat");
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messages = messageRepository.findByChatOrderByCreatedAtDesc(chat, pageable);
        
        return messages.getContent().stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }
    
    public void markMessagesAsRead(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        messageRepository.markMessagesAsRead(chat, user, MessageStatus.READ);
    }

    public void markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify user is participant in chat
        Chat chat = message.getChat();
        if (!chat.getPatient().getId().equals(userId) && !chat.getDoctor().getId().equals(userId)) {
            throw new RuntimeException("User is not a participant in this chat");
        }

        // Only mark as read if user is not the sender
        if (!message.getSender().getId().equals(userId)) {
            message.markAsRead();
            messageRepository.save(message);
            log.debug("Message {} marked as read by user {}", messageId, userId);
        }
    }

    public void addMessageReaction(Long messageId, Long userId, String reaction) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify user is participant in chat
        Chat chat = message.getChat();
        if (!chat.getPatient().getId().equals(userId) && !chat.getDoctor().getId().equals(userId)) {
            throw new RuntimeException("User is not a participant in this chat");
        }

        message.addReaction(userId, reaction);
        messageRepository.save(message);
        log.debug("User {} added reaction {} to message {}", userId, reaction, messageId);
    }

    public MessageResponse replyToMessage(Long chatId, String content, Long senderId, Long replyToMessageId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        Message replyToMessage = messageRepository.findById(replyToMessageId)
                .orElseThrow(() -> new RuntimeException("Reply to message not found"));

        // Verify sender is participant in chat
        if (!chat.getPatient().getId().equals(senderId) && !chat.getDoctor().getId().equals(senderId)) {
            throw new RuntimeException("User is not a participant in this chat");
        }

        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(content);
        message.setStatus(MessageStatus.SENT);
        message.setReplyToMessage(replyToMessage);

        message = messageRepository.save(message);

        // Update chat timestamp
        chat.setUpdatedAt(message.getCreatedAt());
        chatRepository.save(chat);

        MessageResponse response = convertToMessageResponse(message);

        // Broadcast message to chat participants
        broadcastMessage(response);

        return response;
    }

    public MessageResponse sendMessageWithAttachment(Long chatId, String content, Long senderId, org.springframework.web.multipart.MultipartFile file) {
        // For now, just send a regular message indicating file attachment
        // In a full implementation, this would handle file upload
        String messageContent = content != null ? content : "";
        if (file != null && !file.isEmpty()) {
            messageContent += " [File: " + file.getOriginalFilename() + "]";
        }

        MessageResponse response = sendMessage(chatId, messageContent, senderId);
        log.info("Message with attachment sent: chatId={}, senderId={}, filename={}",
                chatId, senderId, file != null ? file.getOriginalFilename() : "none");

        return response;
    }
    
    private ChatResponse convertToChatResponse(Chat chat, User currentUser) {
        ChatResponse response = new ChatResponse();
        response.setId(chat.getId());
        response.setPatient(convertToUserResponse(chat.getPatient()));
        response.setDoctor(convertToUserResponse(chat.getDoctor()));
        response.setCreatedAt(chat.getCreatedAt());
        response.setUpdatedAt(chat.getUpdatedAt());
        
        // Get last message
        Message lastMessage = messageRepository.findLastMessageByChat(chat);
        if (lastMessage != null) {
            response.setLastMessage(convertToMessageResponse(lastMessage));
        }
        
        // Get unread count for current user
        Integer unreadCount = messageRepository.countUnreadMessages(chat, currentUser, MessageStatus.READ);
        response.setUnreadCount(unreadCount);
        
        return response;
    }
    
    private MessageResponse convertToMessageResponse(Message message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setChatId(message.getChat().getId());
        response.setSender(convertToUserResponse(message.getSender()));
        response.setContent(message.getContent());
        response.setStatus(message.getStatus());
        response.setCreatedAt(message.getCreatedAt());
        response.setReadAt(message.getReadAt());
        return response;
    }
    
    private UserResponse convertToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setAvatar(user.getAvatar());
        response.setSpecialization(user.getSpecialization());
        response.setAffiliation(user.getAffiliation());
        return response;
    }

    private void broadcastMessage(MessageResponse message) {
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/chat/" + message.getChatId(), message);
                log.debug("Broadcasted message to chat: {}", message.getChatId());
            } catch (Exception e) {
                log.error("Failed to broadcast message: {}", e.getMessage());
            }
        }
    }

    // DTOs for WebSocket broadcasts
    public record MessageStatusUpdate(
        Long messageId,
        Long chatId,
        String status,
        LocalDateTime timestamp
    ) {}

    public record MessageReactionUpdate(
        Long messageId,
        Long chatId,
        Long userId,
        String reaction,
        String action,
        LocalDateTime timestamp
    ) {}
}
