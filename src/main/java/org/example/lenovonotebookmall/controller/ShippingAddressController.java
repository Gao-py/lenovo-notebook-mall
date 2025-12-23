package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.ShippingAddress;
import org.example.lenovonotebookmall.service.ShippingAddressService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class ShippingAddressController {
    private final ShippingAddressService addressService;
    
    @GetMapping
    public ApiResponse<List<ShippingAddress>> getAddresses(Authentication auth) {
        return ApiResponse.success(addressService.getUserAddresses(auth.getName()));
    }
    
    @PostMapping
    public ApiResponse<ShippingAddress> addAddress(Authentication auth, @RequestBody ShippingAddress address) {
        try {
            return ApiResponse.success(addressService.addAddress(auth.getName(), address));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ApiResponse<ShippingAddress> updateAddress(@PathVariable Long id, @RequestBody ShippingAddress address) {
        try {
            return ApiResponse.success(addressService.updateAddress(id, address));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(id);
        return ApiResponse.success(null);
    }
}