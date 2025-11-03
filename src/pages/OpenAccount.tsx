import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Upload, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/vaultbank-logo.png";
import bgImage from "@/assets/banking-hero.jpg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const OpenAccount = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    maritalStatus: "",
    residentialAddress: "",
    email: "",
    phoneNumber: "",

    // Identity Documents
    idType: "",
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,

    // Proof of Address
    addressProofType: "",
    addressProof: null as File | null,

    // Employment & Financial
    employmentStatus: "",
    employerName: "",
    employerAddress: "",
    monthlyIncome: "",
    sourceOfFunds: "",
    accountPurpose: "",

    // Account Type
    accountType: "",

    // Tax Information
    tin: "",
    ssn: "",
    fatcaCompliant: false,

    // Security
    username: "",
    password: "",
    confirmPassword: "",
    pin: "",
    securityQuestion: "",
    securityAnswer: "",
    twoFactorMethod: "",

    // Terms
    acceptTerms: false,
  });

  // File preview URLs
  const [filePreviews, setFilePreviews] = useState({
    idFront: "",
    idBack: "",
    selfie: "",
    addressProof: "",
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    
    // Create preview URL
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviews(prev => ({ ...prev, [field]: previewUrl }));
    } else {
      setFilePreviews(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.fullName && formData.dateOfBirth && formData.gender && 
               formData.nationality && formData.maritalStatus && formData.phoneNumber && 
               formData.email && formData.residentialAddress;
      case 2:
        return formData.idType && formData.idFront && formData.idBack && formData.selfie;
      case 3:
        return formData.addressProofType && formData.addressProof;
      case 4:
        return formData.employmentStatus && formData.monthlyIncome && 
               formData.sourceOfFunds && formData.accountPurpose;
      case 5:
        return formData.accountType;
      case 6:
        return formData.tin && formData.fatcaCompliant;
      case 7:
        return formData.username && formData.password && formData.confirmPassword && 
               formData.pin && formData.securityQuestion && formData.securityAnswer && 
               formData.twoFactorMethod && formData.password === formData.confirmPassword;
      case 8:
        return formData.acceptTerms;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!validateStep()) {
      // Provide specific error messages for step 7
      if (step === 7) {
        if (!formData.username) {
          alert("Please enter a username.");
        } else if (!formData.password || !formData.confirmPassword) {
          alert("Please enter and confirm your password.");
        } else if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match! Please make sure both password fields are identical.");
        } else if (!formData.pin) {
          alert("Please enter a PIN.");
        } else if (!formData.securityQuestion) {
          alert("Please select a security question.");
        } else if (!formData.securityAnswer) {
          alert("Please provide an answer to your security question.");
        } else if (!formData.twoFactorMethod) {
          alert("Please select a two-factor authentication method.");
        } else {
          alert("Please fill in all required fields before proceeding.");
        }
      } else {
        alert("Please fill in all required fields before proceeding.");
      }
      return;
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      console.log('Uploading file:', path, 'Size:', file.size, 'Type:', file.type);
      
      // Verify file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      const { data, error } = await supabase.storage
        .from('account-documents')
        .upload(path, file, { upsert: true });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);

      // Get signed URL for private bucket (expires in 1 year)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('account-documents')
        .createSignedUrl(path, 31536000); // 1 year in seconds

      if (signedError) {
        console.error('Signed URL error:', signedError);
        throw signedError;
      }

      return signedData.signedUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload ${path.split('/').pop()}: ${error.message || 'Unknown error'}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      alert("Please accept the Terms and Conditions to proceed.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match. Please check and try again.");
      return;
    }

    try {
      // Generate QR secret
      const qrSecret = crypto.randomUUID();

      // Step 1: Create the user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
          alert("This email is already registered. Please use a different email or sign in to your existing account.");
        } else {
          alert(`Error creating account: ${signUpError.message}`);
        }
        return;
      }

      if (!signUpData.user) {
        alert("Failed to create account. Please try again.");
        return;
      }

      const user = signUpData.user;
      console.log('User created:', user.id);

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify session is active
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session after signup');
        alert("Session error. Please try signing in with your credentials.");
        return;
      }

      console.log('Session established, proceeding with uploads');

      // Step 2: Upload documents to storage
      let idFrontUrl = null;
      let idBackUrl = null;
      let selfieUrl = null;
      let addressProofUrl = null;

      if (formData.idFront) {
        console.log('Uploading ID front...');
        idFrontUrl = await uploadFile(formData.idFront, `${user.id}/id-front-${Date.now()}.${formData.idFront.name.split('.').pop()}`);
        if (!idFrontUrl) {
          alert('Failed to upload ID front document. Please try again.');
          return;
        }
      }
      if (formData.idBack) {
        console.log('Uploading ID back...');
        idBackUrl = await uploadFile(formData.idBack, `${user.id}/id-back-${Date.now()}.${formData.idBack.name.split('.').pop()}`);
        if (!idBackUrl) {
          alert('Failed to upload ID back document. Please try again.');
          return;
        }
      }
      if (formData.selfie) {
        console.log('Uploading selfie...');
        selfieUrl = await uploadFile(formData.selfie, `${user.id}/selfie-${Date.now()}.${formData.selfie.name.split('.').pop()}`);
        if (!idBackUrl) {
          alert('Failed to upload selfie. Please try again.');
          return;
        }
      }
      if (formData.addressProof) {
        console.log('Uploading address proof...');
        addressProofUrl = await uploadFile(formData.addressProof, `${user.id}/address-proof-${Date.now()}.${formData.addressProof.name.split('.').pop()}`);
        if (!addressProofUrl) {
          alert('Failed to upload address proof document. Please try again.');
          return;
        }
      }

      // Step 3: Update profile with security info
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          pin: formData.pin,
          security_question: formData.securityQuestion,
          security_answer: formData.securityAnswer,
          phone: formData.phoneNumber,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }

      // Step 4: Save application to database
      const { error } = await supabase.from("account_applications").insert({
        user_id: user.id,
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        email: formData.email,
        phone: formData.phoneNumber,
        address: formData.residentialAddress,
        account_type: formData.accountType,
        ssn: formData.ssn,
        status: 'pending',
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        address_proof_url: addressProofUrl,
        email_verified: false,
        qr_code_secret: qrSecret,
        verification_token: user.id,
      });

      if (error) {
        console.error("Error submitting application:", error);
        alert("There was an error submitting your application. Please try again.");
        return;
      }

      // Step 5: Send verification email
      try {
        await supabase.functions.invoke("send-verification-email", {
          body: {
            email: formData.email,
            fullName: formData.fullName,
            verificationToken: user.id,
            qrSecret: qrSecret,
          },
        });
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
      }

      // Sign out user until they verify email
      await supabase.auth.signOut();

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error:", error);
      alert("There was an error submitting your application. Please try again.");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="VaultBank" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">VaultBank</h1>
              <p className="text-sm text-muted-foreground">Open New Account</p>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Legal Name *</Label>
                  <Input 
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="As on ID/passport"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input 
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input 
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    placeholder="Citizenship"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maritalStatus">Marital Status *</Label>
                  <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange("maritalStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Mobile Phone Number *</Label>
                  <Input 
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="residentialAddress">Residential Address *</Label>
                  <Textarea 
                    id="residentialAddress"
                    value={formData.residentialAddress}
                    onChange={(e) => handleInputChange("residentialAddress", e.target.value)}
                    placeholder="Street address, city, state, postal code"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Identity Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Identity Verification Documents</h2>
              
              <div>
                <Label htmlFor="idType">Document Type *</Label>
                <Select value={formData.idType} onValueChange={(value) => handleInputChange("idType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national_id">National ID Card</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="residence_permit">Residence Permit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="idFront">Front of Document *</Label>
                  <div className="mt-2">
                    <label htmlFor="idFront" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 overflow-hidden relative">
                      {filePreviews.idFront ? (
                        <img src={filePreviews.idFront} alt="ID Front" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload Front</span>
                        </div>
                      )}
                      <input 
                        id="idFront" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileChange("idFront", e.target.files?.[0] || null)}
                      />
                    </label>
                    {formData.idFront && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {formData.idFront.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="idBack">Back of Document *</Label>
                  <div className="mt-2">
                    <label htmlFor="idBack" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 overflow-hidden relative">
                      {filePreviews.idBack ? (
                        <img src={filePreviews.idBack} alt="ID Back" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload Back</span>
                        </div>
                      )}
                      <input 
                        id="idBack" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileChange("idBack", e.target.files?.[0] || null)}
                      />
                    </label>
                    {formData.idBack && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {formData.idBack.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="selfie">Selfie Verification *</Label>
                <div className="mt-2">
                  <label htmlFor="selfie" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 overflow-hidden relative">
                    {filePreviews.selfie ? (
                      <img src={filePreviews.selfie} alt="Selfie" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Upload Selfie</span>
                        <p className="text-xs text-gray-500 mt-1">Hold your ID next to your face</p>
                      </div>
                    )}
                    <input 
                      id="selfie" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      capture="user"
                      onChange={(e) => handleFileChange("selfie", e.target.files?.[0] || null)}
                    />
                  </label>
                  {formData.selfie && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {formData.selfie.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Proof of Address */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Proof of Address</h2>
              <p className="text-sm text-muted-foreground mb-4">Document must be dated within the last 3 months</p>
              
              <div>
                <Label htmlFor="addressProofType">Document Type *</Label>
                <Select value={formData.addressProofType} onValueChange={(value) => handleInputChange("addressProofType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility_bill">Utility Bill (Electricity, Gas, Water)</SelectItem>
                    <SelectItem value="bank_statement">Bank Statement</SelectItem>
                    <SelectItem value="lease_agreement">Lease/Rental Agreement</SelectItem>
                    <SelectItem value="government_correspondence">Official Government Correspondence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="addressProof">Upload Document *</Label>
                <div className="mt-2">
                  <label htmlFor="addressProof" className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 overflow-hidden relative">
                    {filePreviews.addressProof ? (
                      <img src={filePreviews.addressProof} alt="Address Proof" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <span className="text-sm text-gray-600 mt-2 block">Upload Proof of Address</span>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                      </div>
                    )}
                    <input 
                      id="addressProof" 
                      type="file" 
                      className="hidden" 
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange("addressProof", e.target.files?.[0] || null)}
                    />
                  </label>
                  {formData.addressProof && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {formData.addressProof.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Employment & Financial */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Employment & Financial Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employmentStatus">Employment Status *</Label>
                  <Select value={formData.employmentStatus} onValueChange={(value) => handleInputChange("employmentStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self_employed">Self-Employed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="monthlyIncome">Monthly Income Range *</Label>
                  <Select value={formData.monthlyIncome} onValueChange={(value) => handleInputChange("monthlyIncome", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2000">$0 - $2,000</SelectItem>
                      <SelectItem value="2000-5000">$2,000 - $5,000</SelectItem>
                      <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10000+">$10,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="employerName">Employer Name</Label>
                  <Input 
                    id="employerName"
                    value={formData.employerName}
                    onChange={(e) => handleInputChange("employerName", e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="employerAddress">Employer Address</Label>
                  <Input 
                    id="employerAddress"
                    value={formData.employerAddress}
                    onChange={(e) => handleInputChange("employerAddress", e.target.value)}
                    placeholder="Company address"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="sourceOfFunds">Source of Funds *</Label>
                  <Select value={formData.sourceOfFunds} onValueChange={(value) => handleInputChange("sourceOfFunds", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="business">Business Income</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="investment">Investment Returns</SelectItem>
                      <SelectItem value="inheritance">Inheritance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="accountPurpose">Purpose of Account *</Label>
                  <Textarea 
                    id="accountPurpose"
                    value={formData.accountPurpose}
                    onChange={(e) => handleInputChange("accountPurpose", e.target.value)}
                    placeholder="e.g., Personal savings, Business use, Salary deposits, International transfers"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Account Type */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Account Type Selection</h2>
              
              <RadioGroup value={formData.accountType} onValueChange={(value) => handleInputChange("accountType", value)}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal" className="cursor-pointer flex-1">
                      <div className="font-semibold">Personal / Individual Account</div>
                      <p className="text-sm text-muted-foreground">For personal banking and everyday use</p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="joint" id="joint" />
                    <Label htmlFor="joint" className="cursor-pointer flex-1">
                      <div className="font-semibold">Joint Account</div>
                      <p className="text-sm text-muted-foreground">Shared with another person</p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business" className="cursor-pointer flex-1">
                      <div className="font-semibold">Business Account</div>
                      <p className="text-sm text-muted-foreground">For business transactions and operations</p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="savings" id="savings" />
                    <Label htmlFor="savings" className="cursor-pointer flex-1">
                      <div className="font-semibold">Savings Account</div>
                      <p className="text-sm text-muted-foreground">High-yield savings with interest</p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="checking" id="checking" />
                    <Label htmlFor="checking" className="cursor-pointer flex-1">
                      <div className="font-semibold">Current / Checking Account</div>
                      <p className="text-sm text-muted-foreground">For daily transactions and bill payments</p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 6: Tax Information */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Tax Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tin">Tax Identification Number (TIN) *</Label>
                  <Input 
                    id="tin"
                    value={formData.tin}
                    onChange={(e) => handleInputChange("tin", e.target.value)}
                    placeholder="Enter TIN"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ssn">Social Security Number (SSN)</Label>
                  <Input 
                    id="ssn"
                    value={formData.ssn}
                    onChange={(e) => handleInputChange("ssn", e.target.value)}
                    placeholder="XXX-XX-XXXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="fatcaCompliant"
                      checked={formData.fatcaCompliant}
                      onCheckedChange={(checked) => handleInputChange("fatcaCompliant", checked)}
                    />
                    <Label htmlFor="fatcaCompliant" className="text-sm">
                      I declare that I am compliant with FATCA/CRS regulations for international tax reporting. I understand that my account information may be shared with tax authorities as required by law.
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Security Setup */}
          {step === 7 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Security Setup</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="username">Username / Login ID *</Label>
                  <Input 
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    placeholder="Choose a unique username"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Strong password"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="pin">PIN (4-6 digits) *</Label>
                  <Input 
                    id="pin"
                    type="password"
                    value={formData.pin}
                    onChange={(e) => handleInputChange("pin", e.target.value)}
                    placeholder="Enter PIN"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="securityQuestion">Security Question *</Label>
                  <Select value={formData.securityQuestion} onValueChange={(value) => handleInputChange("securityQuestion", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a security question" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_school">What was your first school?</SelectItem>
                      <SelectItem value="pet_name">What was your first pet's name?</SelectItem>
                      <SelectItem value="mother_maiden">What is your mother's maiden name?</SelectItem>
                      <SelectItem value="birth_city">In what city were you born?</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="securityAnswer">Security Answer *</Label>
                  <Input 
                    id="securityAnswer"
                    value={formData.securityAnswer}
                    onChange={(e) => handleInputChange("securityAnswer", e.target.value)}
                    placeholder="Your answer"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="twoFactorMethod">Two-Factor Authentication Method *</Label>
                  <Select value={formData.twoFactorMethod} onValueChange={(value) => handleInputChange("twoFactorMethod", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select 2FA method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS / Text Message</SelectItem>
                      <SelectItem value="email">Email Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Terms & Conditions */}
          {step === 8 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
              
              <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50 text-sm">
                <h3 className="font-semibold mb-2">VAULTBANK ACCOUNT TERMS AND CONDITIONS</h3>
                <p className="mb-2">Last Updated: January 2025</p>
                
                <h4 className="font-semibold mt-4 mb-2">1. ACCOUNT OPENING AND ELIGIBILITY</h4>
                <p className="mb-2">1.1. To open an account with VaultBank, you must be at least 18 years of age and provide valid identification documents as required by law.</p>
                <p className="mb-2">1.2. You agree that all information provided during account opening is accurate, complete, and current.</p>
                
                <h4 className="font-semibold mt-4 mb-2">2. ACCOUNT USAGE AND RESPONSIBILITIES</h4>
                <p className="mb-2">2.1. You are responsible for maintaining the confidentiality of your account credentials, including username, password, PIN, and any security tokens.</p>
                <p className="mb-2">2.2. You agree to notify VaultBank immediately of any unauthorized access to your account.</p>
                <p className="mb-2">2.3. VaultBank is not liable for losses resulting from unauthorized access if you have failed to protect your credentials.</p>
                
                <h4 className="font-semibold mt-4 mb-2">3. FEES AND CHARGES</h4>
                <p className="mb-2">3.1. Account maintenance fees, if applicable, will be clearly disclosed prior to account activation.</p>
                <p className="mb-2">3.2. Transaction fees may apply for certain services including wire transfers, international transactions, and ATM withdrawals outside our network.</p>
                <p className="mb-2">3.3. VaultBank reserves the right to modify fees with 30 days' written notice.</p>
                
                <h4 className="font-semibold mt-4 mb-2">4. DEPOSITS AND WITHDRAWALS</h4>
                <p className="mb-2">4.1. Deposits may be subject to verification and hold periods as required by banking regulations.</p>
                <p className="mb-2">4.2. Daily withdrawal limits apply and vary by account type.</p>
                
                <h4 className="font-semibold mt-4 mb-2">5. PRIVACY AND DATA PROTECTION</h4>
                <p className="mb-2">5.1. VaultBank is committed to protecting your personal information in accordance with applicable privacy laws.</p>
                <p className="mb-2">5.2. Your information may be shared with regulatory authorities, credit bureaus, and service providers as necessary for account operation.</p>
                <p className="mb-2">5.3. We employ industry-standard security measures to protect your data.</p>
                
                <h4 className="font-semibold mt-4 mb-2">6. ANTI-MONEY LAUNDERING (AML) AND COMPLIANCE</h4>
                <p className="mb-2">6.1. VaultBank complies with all applicable anti-money laundering and counter-terrorism financing regulations.</p>
                <p className="mb-2">6.2. We reserve the right to request additional documentation to verify the source of funds.</p>
                <p className="mb-2">6.3. Suspicious activities will be reported to relevant authorities as required by law.</p>
                
                <h4 className="font-semibold mt-4 mb-2">7. ACCOUNT CLOSURE AND TERMINATION</h4>
                <p className="mb-2">7.1. Either party may close the account with written notice.</p>
                <p className="mb-2">7.2. VaultBank reserves the right to close accounts that violate these terms or applicable laws.</p>
                <p className="mb-2">7.3. Upon closure, remaining balances will be returned to you after deducting any outstanding fees.</p>
                
                <h4 className="font-semibold mt-4 mb-2">8. LIMITATION OF LIABILITY</h4>
                <p className="mb-2">8.1. VaultBank is not liable for losses due to circumstances beyond our reasonable control, including but not limited to natural disasters, system failures, or third-party actions.</p>
                <p className="mb-2">8.2. Our liability for errors or unauthorized transactions is limited as prescribed by applicable banking regulations.</p>
                
                <h4 className="font-semibold mt-4 mb-2">9. DISPUTE RESOLUTION</h4>
                <p className="mb-2">9.1. Any disputes arising from these terms shall be resolved through binding arbitration in accordance with applicable arbitration rules.</p>
                <p className="mb-2">9.2. You waive the right to participate in class action lawsuits against VaultBank.</p>
                
                <h4 className="font-semibold mt-4 mb-2">10. AMENDMENTS</h4>
                <p className="mb-2">10.1. VaultBank may amend these terms at any time with 30 days' notice.</p>
                <p className="mb-2">10.2. Continued use of your account after amendments constitutes acceptance of the new terms.</p>
                
                <h4 className="font-semibold mt-4 mb-2">11. CONTACT INFORMATION</h4>
                <p className="mb-2">For questions or concerns regarding these terms, please contact:</p>
                <p className="mb-2">VaultBank Customer Service</p>
                <p className="mb-2">Email: support@vaultbank.com</p>
                <p className="mb-2">Phone: 1-800-VAULT-BANK</p>
                
                <p className="mt-4 font-semibold">By checking the box below, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
              </div>

              <div className="flex items-start space-x-2 mt-4">
                <Checkbox 
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange("acceptTerms", checked)}
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  I have read and agree to the Terms and Conditions, Privacy Policy, and all declarations stated above. I consent to VaultBank processing my personal information as described. *
                </Label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="font-semibold mb-2">What Happens Next?</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Your application will be reviewed by our team (typically 1-2 business days)</li>
                  <li>We may contact you for additional verification via phone or video call</li>
                  <li>Once approved, you'll receive your account number and IBAN via email</li>
                  <li>Your debit card will be mailed within 5-7 business days</li>
                  <li>Online banking access will be activated immediately upon approval</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            
            {step < totalSteps && (
              <Button type="button" onClick={nextStep} className="ml-auto">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            
            {step === totalSteps && (
              <Button 
                type="submit" 
                className="ml-auto"
                disabled={!formData.acceptTerms}
              >
                Submit Application
              </Button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© 2025 VaultBank. All rights reserved.</p>
          <p className="mt-1">Member FDIC. Equal Housing Lender.</p>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Application Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mt-2">
                <p className="font-semibold text-amber-900 mb-1">⚠️ IMPORTANT: Email Verification Required</p>
                <p className="text-sm text-amber-800">
                  You MUST verify your email address before you can sign in. Check your inbox (and spam folder) for the verification link.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <h3 className="font-semibold text-sm">What Happens Next?</h3>
            <ul className="text-sm space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5 font-bold">1.</span>
                <span className="font-semibold">Check your email NOW and click the verification link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">2.</span>
                <span>After email verification, complete QR code authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">3.</span>
                <span>Your application will be reviewed by our team (1-2 business days)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">4.</span>
                <span>We may contact you for additional verification via phone or video call</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">5.</span>
                <span>Once approved, you'll receive your account details via email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">6.</span>
                <span>Your debit card will be mailed within 5-7 business days after approval</span>
              </li>
            </ul>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-4">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> You cannot sign in until your email is verified. Please check your inbox immediately!
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
              Close
            </Button>
            <Link to="/auth" className="w-full">
              <Button variant="outline" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OpenAccount;