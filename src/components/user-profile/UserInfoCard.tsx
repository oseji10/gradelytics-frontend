"use client";
import React, { useEffect, useState, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import api from "../../../lib/api";
import Image from "next/image";

interface ClassInfo {
  className: string;
  classId?: number;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role?: string;
  isClassTeacher?: boolean;
  classHead?: ClassInfo | null;
  signatureUrl?: string | null;
}

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    newPassword_confirmation: "",
  });

  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [updating, setUpdating] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profile");
        const data = response.data;

        const profile: UserProfile = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          role: data.role,
          isClassTeacher: data.isClassTeacher || data.role === "class_teacher" || false,
          classHead: data.classHead || data.formClass || null,
          signatureUrl: data.signatureUrl || data.signature || null,
        };

        setUserData(profile);
        setFormData({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phoneNumber: profile.phoneNumber,
        });

        if (profile.signatureUrl) {
          setSignaturePreview(`${process.env.NEXT_PUBLIC_FILE_URL}${profile.signatureUrl}`);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setSignaturePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setUpdating(true);
    try {
      await api.patch("/profile", formData);
      setUserData((prev) => (prev ? { ...prev, ...formData } : null));
      alert("Profile updated successfully!");
      closeModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.newPassword_confirmation) {
      alert("New password and confirmation do not match!");
      return;
    }
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      alert("Please fill in current and new password.");
      return;
    }

    setUpdating(true);
    try {
      await api.patch("/profile/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        newPassword_confirmation: passwordData.newPassword_confirmation,
      });
      alert("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        newPassword_confirmation: "",
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to change password");
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadSignature = async () => {
    if (!signatureFile) {
      alert("Please select a signature image first.");
      return;
    }

    setUploadingSignature(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("signature", signatureFile);

      const res = await api.post("/profile/signature", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newSignatureUrl = res.data.signatureUrl || res.data.signature;
      setUserData((prev) =>
        prev ? { ...prev, signatureUrl: newSignatureUrl } : null
      );
      setSignaturePreview(`${process.env.NEXT_PUBLIC_FILE_URL}${newSignatureUrl}`);
      setSignatureFile(null);
      if (signatureInputRef.current) signatureInputRef.current.value = "";

      alert("Signature updated successfully!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to upload signature");
    } finally {
      setUploadingSignature(false);
    }
  };

  const isClassTeacher = userData?.isClassTeacher || false;

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userData?.firstName || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userData?.lastName || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userData?.email || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userData?.phoneNumber || "Not provided"}
              </p>
            </div>

            {isClassTeacher && (
              <>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Role
                  </p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Class Teacher
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Class Head Of
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userData?.classHead?.className || "Not assigned yet"}
                  </p>
                </div>

                <div className="col-span-1 lg:col-span-2">
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Your Signature
                  </p>
                  {userData?.signatureUrl ? (
                    <div className="inline-block rounded  bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_FILE_URL}${userData.signatureUrl}`}
                        alt="Your signature"
                        width={300}
                        height={100}
                        className="max-h-20 w-auto object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="text-sm italic text-gray-500 dark:text-gray-400">
                      No signature uploaded yet
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          {(!formData.firstName && !formData.email) ? (
            <div className="p-8 text-center">
              <p>Loading form data...</p>
            </div>
          ) : (
            <>
              <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  Edit Personal Information
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                  Update your details and change your password if needed.
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
                <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                  {/* Personal Information */}
                  <div>
                    <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                      Personal Information
                    </h5>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      <div>
                        <Label>First Name</Label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter first name"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <Label>Last Name</Label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter last name"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <Label>Email Address</Label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <Label>Phone Number</Label>
                        <input
                          type="text"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="Enter phone number"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Class Teacher Signature Section */}
                  {isClassTeacher && (
                    <div className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-700">
                      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90">
                        Class Teacher Signature
                      </h5>
                      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        This signature will appear on report cards, result sheets, and other official documents.
                      </p>

                      <div className="space-y-5">
                        <div>
                          <Label>Upload / Update Signature</Label>
                          <Input
                            ref={signatureInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureChange}
                          />
                        </div>

                        {(signaturePreview || userData?.signatureUrl) && (
                          <div>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Preview:</p>
                            <div className="inline-block rounded border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                              <Image
                                src={signaturePreview || `${process.env.NEXT_PUBLIC_FILE_URL}${userData?.signatureUrl}`}
                                alt="Signature preview"
                                width={320}
                                height={120}
                                className="max-h-24 w-auto object-contain"
                                unoptimized
                              />
                            </div>
                          </div>
                        )}

                        <Button
                          type="button"
                          onClick={handleUploadSignature}
                          disabled={uploadingSignature || !signatureFile}
                          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                          {uploadingSignature
                            ? "Uploading..."
                            : userData?.signatureUrl
                            ? "Update Signature"
                            : "Upload Signature"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Change Password */}
                  <div className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-700">
                    <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                      Change Password (Optional)
                    </h5>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      <div>
                        <Label>Current Password</Label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <Label>New Password</Label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <Label>Confirm New Password</Label>
                        <input
                          type="password"
                          name="newPassword_confirmation"
                          value={passwordData.newPassword_confirmation}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 px-2 mt-8 lg:justify-end">
                  <Button variant="outline" onClick={closeModal} disabled={updating || uploadingSignature}>
                    Cancel
                  </Button>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={updating || uploadingSignature}
                    className="!bg-[#1F6F43] hover:!bg-[#084d93]"
                  >
                    {updating ? "Saving..." : "Save Profile"}
                  </Button>

                  {(passwordData.currentPassword || passwordData.newPassword) && (
                    <Button
                      onClick={handleChangePassword}
                      disabled={
                        updating ||
                        uploadingSignature ||
                        passwordData.newPassword !== passwordData.newPassword_confirmation ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updating ? "Changing..." : "Change Password"}
                    </Button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}