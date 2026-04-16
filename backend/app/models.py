from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    candidate = "candidate"
    hr = "hr"
    manager = "manager"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.candidate)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    desired_position = Column(String, nullable=False)
    salary_expectation = Column(Integer)
    employment_type = Column(String)
    work_format = Column(String)
    about = Column(Text)
    status = Column(String, default="new")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    in_basket = Column(Boolean, default=False)

    candidate = relationship("User", backref="resumes")
    documents = relationship("Document", back_populates="resume")
    experiences = relationship("WorkExperience", back_populates="resume")
    educations = relationship("Education", back_populates="resume")

class WorkExperience(Base):
    __tablename__ = "work_experiences"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    description = Column(Text)

    resume = relationship("Resume", back_populates="experiences")

class Education(Base):
    __tablename__ = "education"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    institution = Column(String, nullable=False)
    degree = Column(String)
    field_of_study = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)

    resume = relationship("Resume", back_populates="educations")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="documents")

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"))
    hr_id = Column(Integer, ForeignKey("users.id"))
    manager_id = Column(Integer, ForeignKey("users.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    datetime = Column(DateTime, nullable=False)
    format = Column(String)
    location_or_link = Column(String)
    comment = Column(Text)
    status = Column(String, default="scheduled")

    candidate = relationship("User", foreign_keys=[candidate_id])
    hr = relationship("User", foreign_keys=[hr_id])
    manager = relationship("User", foreign_keys=[manager_id])

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_score = Column(Integer)
    strengths = Column(Text)
    weaknesses = Column(Text)
    comment = Column(Text)
    recommendation = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    interview = relationship("Interview", backref="reviews")
    resume = relationship("Resume", backref="reviews")
    reviewer = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])