package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.repository.StaffRepository;
import ac.za.cput.pulseup2026.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final TimeSlotRepository timeSlotRepository;

    public StaffService(
            StaffRepository staffRepository,
            TimeSlotRepository timeSlotRepository
    ) {
        this.staffRepository = staffRepository;
        this.timeSlotRepository = timeSlotRepository;
    }

    public Staff saveStaff(Staff staff) {
        if (staff == null) {
            return null;
        }

        return staffRepository.save(staff);
    }

    public Staff getStaffById(Long id) {
        return staffRepository.findById(id).orElse(null);
    }

    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
    }

    public Staff updateStaff(Staff staff) {
        if (staff == null || staff.getUserId() == null) {
            return null;
        }

        return staffRepository.save(staff);
    }

    public boolean deleteStaff(Long id) {
        if (id == null ||
                !staffRepository.existsById(id) ||
                timeSlotRepository.existsByStaff_UserId(id)) {
            return false;
        }

        staffRepository.deleteById(id);
        return true;
    }
}