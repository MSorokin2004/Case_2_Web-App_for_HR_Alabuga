from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    candidate = "candidate"
    hr = "hr"
    manager = "manager"
    admin = "admin"

# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.candidate

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

# Resume schemas
class WorkExperienceBase(BaseModel):
    company: str
    position: str
    start_date: datetime
    end_date: Optional[datetime] = None
    description: Optional[str] = None

class WorkExperienceCreate(WorkExperienceBase):
    pass

class WorkExperienceOut(WorkExperienceBase):
    id: int
    class Config:
        from_attributes = True

class EducationBase(BaseModel):
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class EducationCreate(EducationBase):
    pass

class EducationOut(EducationBase):
    id: int
    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: Optional[str]
    uploaded_at: datetime
    class Config:
        from_attributes = True

class ResumeBase(BaseModel):
    desired_position: str
    salary_expectation: Optional[int] = None
    employment_type: Optional[str] = None
    work_format: Optional[str] = None
    about: Optional[str] = None

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(ResumeBase):
    status: Optional[str] = None

class ResumeOut(ResumeBase):
    id: int
    candidate_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    in_basket: bool = False
    candidate: UserOut
    experiences: List[WorkExperienceOut] = []
    educations: List[EducationOut] = []
    documents: List[DocumentOut] = []

    class Config:
        from_attributes = True

class ResumeDetailOut(ResumeOut):
    reviews: List['ReviewOut'] = []

# Interview schemas
class InterviewCreate(BaseModel):
    candidate_id: int
    manager_id: int
    resume_id: int
    datetime: datetime
    format: str = "online"
    location_or_link: Optional[str] = None
    comment: Optional[str] = None

class InterviewOut(BaseModel):
    id: int
    candidate_id: int
    hr_id: int
    manager_id: int
    resume_id: int
    datetime: datetime
    format: str
    location_or_link: Optional[str]
    comment: Optional[str]
    status: str
    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    resume_id: int
    overall_score: int
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    comment: Optional[str] = None
    recommendation: str

class ReviewOut(BaseModel):
    id: int
    resume_id: Optional[int] = None
    interview_id: Optional[int] = None
    reviewer_id: int
    overall_score: int
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    comment: Optional[str] = None
    recommendation: str
    created_at: datetime
    reviewer: Optional[UserOut] = None

    class Config:
        from_attributes = True

class NotificationCreate(BaseModel):
    recipient_id: int
    title: str
    message: str

class NotificationOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    sender: Optional[UserOut] = None

    class Config:
        from_attributes = True