package com.vendor.vendor_service.repository;

import com.vendor.vendor_service.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
}
