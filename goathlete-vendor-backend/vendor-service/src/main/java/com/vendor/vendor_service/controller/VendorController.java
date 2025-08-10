package com.vendor.vendor_service.controller;

import com.vendor.vendor_service.entity.Vendor;
import com.vendor.vendor_service.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class VendorController {

    @Autowired
    private VendorRepository vendorRepository;

    @QueryMapping
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @MutationMapping
    public Vendor createVendor(@Argument("input") Vendor input) {
        return vendorRepository.save(input);
    }
}
