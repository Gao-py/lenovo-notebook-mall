package org.example.lenovonotebookmall.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    private String phone;
    private String address;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;

    private Boolean isVip = false;
    private LocalDateTime createTime = LocalDateTime.now();

    private String nickname;

    @Column(columnDefinition = "LONGTEXT")
    private String avatar;

    private LocalDate birthday;
    private String gender;

    @Column(length = 200)
    private String signature;

    public enum UserRole {
        USER, ADMIN
    }
}