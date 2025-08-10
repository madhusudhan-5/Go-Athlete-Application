package com.vendor.vendor_service.controller;

import com.vendor.vendor_service.dto.VendorDTO;
import com.vendor.vendor_service.entity.Vendor;
import com.vendor.vendor_service.service.VendorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping
    public ResponseEntity<List<Vendor>> getAllVendors() {
        return ResponseEntity.ok(vendorService.getAllVendors());
    }

    @PostMapping
    public ResponseEntity<Vendor> createVendor(@RequestBody VendorDTO vendorDTO) {
        return ResponseEntity.ok(vendorService.createVendor(vendorDTO));
    }
}
