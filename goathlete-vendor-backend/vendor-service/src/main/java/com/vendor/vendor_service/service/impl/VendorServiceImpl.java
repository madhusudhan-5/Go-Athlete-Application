package com.vendor.vendor_service.service.impl;

import com.vendor.vendor_service.dto.VendorDTO;
import com.vendor.vendor_service.entity.Vendor;
import com.vendor.vendor_service.repository.VendorRepository;
import com.vendor.vendor_service.service.VendorService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;

    public VendorServiceImpl(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @Override
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @Override
    public Vendor createVendor(VendorDTO dto) {
        Vendor vendor = new Vendor();
        vendor.setName(dto.getName());
        vendor.setEmail(dto.getEmail());
        vendor.setPhone(dto.getPhone());
        vendor.setPasswordHash(dto.getPasswordHash());
        vendor.setBusinessType(dto.getBusinessType());
        vendor.setVerified(dto.getVerified());
        vendor.setStatus(dto.getStatus());
        return vendorRepository.save(vendor);
    }
}
