package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.ShippingAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShippingAddressRepository extends JpaRepository<ShippingAddress, Long> {
    List<ShippingAddress> findByUserId(Long userId);
}