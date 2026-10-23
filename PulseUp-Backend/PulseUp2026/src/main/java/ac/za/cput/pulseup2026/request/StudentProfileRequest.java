package ac.za.cput.pulseup2026.request;

import ac.za.cput.pulseup2026.domain.YearOfStudy;

public class StudentProfileRequest {

    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String course;
    private String campus;
    private String residence;
    private YearOfStudy yearOfStudy;
    private String emergencyContactName;
    private String emergencyContactPhone;

    public StudentProfileRequest() {
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getCampus() {
        return campus;
    }

    public void setCampus(String campus) {
        this.campus = campus;
    }

    public String getResidence() {
        return residence;
    }

    public void setResidence(String residence) {
        this.residence = residence;
    }

    public YearOfStudy getYearOfStudy() {
        return yearOfStudy;
    }

    public void setYearOfStudy(
            YearOfStudy yearOfStudy
    ) {
        this.yearOfStudy = yearOfStudy;
    }

    public String getEmergencyContactName() {
        return emergencyContactName;
    }

    public void setEmergencyContactName(
            String emergencyContactName
    ) {
        this.emergencyContactName =
                emergencyContactName;
    }

    public String getEmergencyContactPhone() {
        return emergencyContactPhone;
    }

    public void setEmergencyContactPhone(
            String emergencyContactPhone
    ) {
        this.emergencyContactPhone =
                emergencyContactPhone;
    }
}