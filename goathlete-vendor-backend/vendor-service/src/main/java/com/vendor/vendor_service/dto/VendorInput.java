package com.vendor.vendor_service.dto;

import lombok.Data;

@Data
public class VendorInput {
    private String name;
    private String email;
    private String phone;
    private String businessType;
}
