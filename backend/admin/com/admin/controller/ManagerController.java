package com.admin.controller;

import com.admin.dto.ManagerClientResponse;
import com.admin.entity.User;
import com.admin.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final UserRepository userRepository;

    public ManagerController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/clients")
    public List<ManagerClientResponse> getManagerClients() {
        try {
            return userRepository.findAll()
                    .stream()
                    .filter(this::isClientUser)
                    .filter(this::isActiveUser)
                    .map(user -> new ManagerClientResponse(
                            user.getId(),
                            readString(user, "getName", "getFullName", "getUsername"),
                            user.getEmail(),
                            String.valueOf(user.getRole())
                    ))
                    .toList();
        } catch (Exception error) {
            error.printStackTrace();
            return Collections.emptyList();
        }
    }

    private boolean isClientUser(User user) {
        if (user == null) {
            return false;
        }

        Object roleValue = readValue(user, "getRole", "getRoles");
        if (roleValue == null) {
            return false;
        }

        String role = String.valueOf(roleValue).trim().toUpperCase();

        return role.equals("CLIENT")
                || role.equals("ROLE_CLIENT")
                || role.contains("CLIENT");
    }

    private boolean isActiveUser(User user) {
        if (user == null) {
            return false;
        }

        Boolean enabled = readBoolean(user, "isEnabled", "getEnabled", "isActive", "getActive");
        if (enabled != null) {
            return enabled;
        }

        String status = readString(user, "getStatus");
        if (status != null && !status.isBlank()) {
            String value = status.trim().toUpperCase();
            return value.equals("ACTIVE")
                    || value.equals("ENABLED")
                    || value.equals("APPROVED")
                    || value.equals("TRUE");
        }

        return true;
    }

    private Object readValue(Object target, String... methodNames) {
        for (String methodName : methodNames) {
            try {
                Method method = target.getClass().getMethod(methodName);
                return method.invoke(target);
            } catch (Exception ignored) {
            }
        }

        return null;
    }

    private Boolean readBoolean(Object target, String... methodNames) {
        for (String methodName : methodNames) {
            Object value = readValue(target, methodName);
            if (value instanceof Boolean booleanValue) {
                return booleanValue;
            }
        }

        return null;
    }

    private String readString(Object target, String... methodNames) {
        for (String methodName : methodNames) {
            Object value = readValue(target, methodName);
            if (value != null) {
                return String.valueOf(value);
            }
        }

        return "";
    }
}
