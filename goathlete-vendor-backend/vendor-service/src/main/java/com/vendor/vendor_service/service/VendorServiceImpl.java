package com.vendor.vendor_service.service;

import com.vendor.vendor_service.dto.VendorInput;
import com.vendor.vendor_service.entity.Vendor;
import com.vendor.vendor_service.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public Vendor register(VendorInput input) {
        String autoPassword = RandomStringUtils.randomAlphanumeric(8);

        Vendor vendor = new Vendor();
        vendor.setName(input.getName());
        vendor.setEmail(input.getEmail());
        vendor.setPhone(input.getPhone());
        vendor.setBusinessType(input.getBusinessType().toUpperCase());
        vendor.setPasswordHash(passwordEncoder.encode(autoPassword));
        vendor.setStatus("INACTIVE");
        vendor.setVerified(false);

        // TODO: Email password reset link

        return vendorRepository.save(vendor);
    }

    @Override
    public Vendor getVendorById(Long id) {
        return vendorRepository.findById(id).orElse(null);
    }

    @Override
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }
}
// 39syNrPuKF5AD0JZ