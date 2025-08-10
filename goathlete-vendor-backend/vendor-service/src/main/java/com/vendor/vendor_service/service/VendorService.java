package com.vendor.vendor_service.service;

import com.vendor.vendor_service.dto.VendorDTO;
import com.vendor.vendor_service.entity.Vendor;

import java.util.List;

public interface VendorService {
    List<Vendor> getAllVendors();
    Vendor createVendor(VendorDTO dto);
}
