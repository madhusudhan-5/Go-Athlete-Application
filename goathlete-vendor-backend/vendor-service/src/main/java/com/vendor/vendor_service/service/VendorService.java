package com.vendor.vendor_service.service;

import com.vendor.vendor_service.dto.VendorInput;
import com.vendor.vendor_service.entity.Vendor;

import java.util.List;

public interface VendorService {
    Vendor register(VendorInput input);
    Vendor getVendorById(Long id);
    List<Vendor> getAllVendors();
}