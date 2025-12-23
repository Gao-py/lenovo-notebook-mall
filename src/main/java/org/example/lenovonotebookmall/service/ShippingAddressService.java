package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.ShippingAddress;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.ShippingAddressRepository;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShippingAddressService {
    private final ShippingAddressRepository addressRepository;
    private final UserRepository userRepository;
    
    public List<ShippingAddress> getUserAddresses(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return addressRepository.findByUserId(user.getId());
    }
    
    @Transactional
    public ShippingAddress addAddress(String username, ShippingAddress address) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        address.setUser(user);
        
        if (address.getIsDefault()) {
            addressRepository.findByUserId(user.getId()).forEach(a -> {
                a.setIsDefault(false);
                addressRepository.save(a);
            });
        }
        
        return addressRepository.save(address);
    }
    
    @Transactional
    public ShippingAddress updateAddress(Long id, ShippingAddress address) {
        ShippingAddress existing = addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("地址不存在"));
        
        if (address.getReceiverName() != null) {
            existing.setReceiverName(address.getReceiverName());
        }
        if (address.getPhone() != null) {
            existing.setPhone(address.getPhone());
        }
        if (address.getAddress() != null) {
            existing.setAddress(address.getAddress());
        }
        
        if (address.getIsDefault() != null && address.getIsDefault()) {
            addressRepository.findByUserId(existing.getUser().getId()).forEach(a -> {
                if (!a.getId().equals(id)) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            });
            existing.setIsDefault(true);
        }
        
        return addressRepository.save(existing);
    }
    
    public void deleteAddress(Long id) {
        addressRepository.deleteById(id);
    }
}