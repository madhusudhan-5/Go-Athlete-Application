package com.vendor.vendor_service.dto;

import lombok.Data;

@Data
public class VendorDTO {
    private String name;
    private String email;
    private String phone;
    private String passwordHash;
    private String businessType;
    private Boolean verified;
    private String status;
}
