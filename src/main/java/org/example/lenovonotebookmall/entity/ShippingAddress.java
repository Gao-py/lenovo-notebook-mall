package org.example.lenovonotebookmall.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "shipping_addresses")
@JsonIgnoreProperties({"user"})
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