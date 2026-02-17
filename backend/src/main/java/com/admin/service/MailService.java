package com.admin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    public void sendInviteEmail(String toEmail, String fullName, String role, String inviteUrl, String tempPassword) {
        System.out.println("✅ MailService: Sending invite email to: " + toEmail);

        String safeName = (fullName == null || fullName.trim().isEmpty()) ? "User" : fullName.trim();
        String safeRole = (role == null) ? "CLIENT" : role;

        String body =
                "Hello " + safeName + ",\n\n" +
                "You have been invited to Nexora Admin.\n" +
                "Role: " + safeRole + "\n\n" +
                "Invite link:\n" + inviteUrl + "\n\n" +
                "Temporary password (share securely):\n" + tempPassword + "\n\n" +
                "Thanks,\n" +
                "Nexora Team\n";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(toEmail);
        message.setSubject("You're invited to Nexora Admin");
        message.setText(body);

        try {
            mailSender.send(message);
            System.out.println("✅ MailService: Email SENT to: " + toEmail);
        } catch (MailException ex) {
            System.out.println("❌ MailService: Email FAILED: " + ex.getMessage());
            throw ex;
        }
    }
}
