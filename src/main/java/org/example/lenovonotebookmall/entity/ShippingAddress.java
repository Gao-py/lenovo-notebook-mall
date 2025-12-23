package org.example.lenovonotebookmall.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "shipping_addresses")
public class ShippingAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    private String receiverName;
    private String phone;
    private String address;
    private Boolean isDefault = false;
}