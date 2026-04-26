import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, MapPin, Building, Globe, Calendar, BookOpen, Edit, Save, Camera, Phone, GraduationCap, Award, Briefcase, Users, X, Check, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { profileApi, dashboardApi } from '../services/api';

interface InstructorProfile {
  full_name?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  phone_number?: string;
  national_id?: string;
  profile_photo?: string;
  staff_id?: string;
  employment_type?: string;
  academic_rank?: string;
  college_id?: string;
  date_of_employment?: string;
  highest_qualification?: string;
  field_of_specialization?: string;
  awarding_institution?: string;
  year_of_graduation?: number;
  bio?: string;
  office_location?: string;
  office_hours?: string;
}

interface DegreeProgramme {
  id: string;
  name: string;
  code?: string;
}

interface College {
  id: string;
  name: string;
  code?: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  department?: string;
  institution?: string;
  country?: string;
  timezone?: string;
  language?: string;
  phone_number?: string;
  gender?: string;
  nationality?: string;
  year_of_study?: number;
  education_level?: string;
  profile_image?: string;
  profile_image_url?: string;
  instructor_profile?: InstructorProfile;
  assigned_degree_programmes?: DegreeProgramme[];
  college?: College;
  degree_programme?: DegreeProgramme;
  registration_number?: string;
}

export default function Profile() {
  const { currentUser, courses } = useApp();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<ProfileData>>({});

  // Fetch full profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.get();
      const data = response.data.data as ProfileData;
      setProfile(data);
      setForm(data);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const myCourses = courses.filter(c => {
    const c2 = c as unknown as Record<string, unknown>;
    return c2.instructor_id === profile?.id || c2.instructorId === profile?.id;
  });

  const [snapshot, setSnapshot] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (profile?.role === 'instructor') {
      dashboardApi.instructorSnapshot().then(r => {
        setSnapshot(r.data ?? {});
      }).catch(() => {});
    }
  }, [profile?.role]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await profileApi.update(form);
      const updatedData = response.data.data as ProfileData;
      setProfile(updatedData);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      let response;
      if (profile?.role === 'instructor' && profile?.instructor_profile) {
        response = await profileApi.uploadInstructorImage(file);
      } else {
        response = await profileApi.uploadImage(file);
      }
      
      // Reload profile to get updated image URL
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Are you sure you want to remove your profile image?')) return;
    
    setUploadingImage(true);
    try {
      await profileApi.removeImage();
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove image');
    } finally {
      setUploadingImage(false);
    }
  };

  const getInitials = () => {
    if (profile?.instructor_profile?.full_name) {
      return profile.instructor_profile.full_name.slice(0, 2).toUpperCase();
    }
    return profile?.name?.slice(0, 2).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    return profile?.instructor_profile?.full_name || profile?.name || '';
  };

  const SelectField = ({ icon: Icon, label, value, editKey, options }: { 
    icon: React.ElementType; 
    label: string; 
    value: string; 
    editKey: keyof typeof form;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        {editing ? (
          <select
            value={form[editKey] as string || ''}
            onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Select {label}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-gray-800 mt-0.5">{value || '—'}</p>
        )}
      </div>
    </div>
  );

  const Field = ({ icon: Icon, label, value, editKey, type = 'text' }: { 
    icon: React.ElementType; 
    label: string; 
    value: string; 
    editKey?: keyof typeof form;
    type?: string;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        {editing && editKey ? (
          editKey === 'bio' ? (
            <textarea
              value={String(form[editKey] ?? '')}
              onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
              rows={3}
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          ) : type === 'number' ? (
            <input
              type="number"
              value={String(form[editKey] ?? '')}
              onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : type === 'date' ? (
            <input
              type="date"
              value={String(form[editKey] ?? '')}
              onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <input
              type="text"
              value={String(form[editKey] ?? '')}
              onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )
        ) : (
          <p className="text-sm text-gray-800 mt-0.5">{value || '—'}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(profile || {}); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50">
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium flex items-center gap-2">
          <X className="w-4 h-4" /> {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> Profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <div className="relative inline-block">
              {profile?.profile_image_url ? (
                <img 
                  src={profile.profile_image_url} 
                  alt={getDisplayName()}
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto">
                  {getInitials()}
                </div>
              )}
              {(editing || profile?.profile_image_url) && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 shadow-lg disabled:opacity-60"
                  >
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>
            {profile?.profile_image_url && (
              <button 
                onClick={handleRemoveImage}
                disabled={uploadingImage}
                className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Remove Photo
              </button>
            )}
            <h2 className="mt-4 font-bold text-gray-900 text-lg">{getDisplayName()}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{profile?.email}</p>
            <span className="inline-block mt-2 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium capitalize">
              {profile?.role}
            </span>

            {/* Role-specific badges */}
            {profile?.role === 'instructor' && profile?.instructor_profile?.academic_rank && (
              <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                {profile.instructor_profile.academic_rank.replace('_', ' ')}
              </span>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3 text-left">
              {profile?.role === 'instructor' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Courses</span>
                    <span className="font-semibold text-gray-800">{myCourses.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Students</span>
                    <span className="font-semibold text-gray-800">
                      {myCourses.reduce((s, c) => s + ((c as unknown as Record<string,number>).enrolled_students ?? (c as unknown as Record<string,number>).enrolledStudents ?? 0), 0)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="font-semibold text-gray-800">{profile?.registration_number ? '2024' : '—'}</span>
              </div>
            </div>
          </div>

          {/* College & Degree Programme Info */}
          {(profile?.college || profile?.assigned_degree_programmes || profile?.degree_programme) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4" /> Academic Info
              </h3>
              {profile?.college && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 font-medium uppercase">College</p>
                  <p className="text-sm text-gray-800">{profile.college.name}</p>
                </div>
              )}
              {profile?.degree_programme && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 font-medium uppercase">Degree Programme</p>
                  <p className="text-sm text-gray-800">{profile.degree_programme.name}</p>
                </div>
              )}
              {profile?.assigned_degree_programmes && profile.assigned_degree_programmes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Assigned Programmes</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.assigned_degree_programmes.map(prog => (
                      <span key={prog.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {prog.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick stats - Instructors only */}
          {profile?.role === 'instructor' && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-3">This Month</h3>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const activeCourses = (snapshot.active_courses ?? []) as Record<string,unknown>[];
                  const totalActivities = activeCourses.reduce((sum, c) => {
                    const sections = (c.sections ?? []) as Record<string,unknown>[];
                    const acts = sections.reduce((s2, sec) => s2 + ((sec.activities as unknown[]) ?? []).length, 0);
                    return sum + acts;
                  }, 0);
                  return [
                    { label: 'Active Courses',   value: activeCourses.length || myCourses.length },
                    { label: 'Total Enrollments', value: Number(snapshot.total_enrollments ?? 0) },
                    { label: 'Pending Grading',  value: Number(snapshot.pending_grading_count ?? 0) },
                    { label: 'Activities',       value: totalActivities },
                  ];
                })().map(s => (
                  <div key={s.label} className="text-center bg-white/10 rounded-xl p-3">
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-indigo-200 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </h3>
            <Field icon={User} label="Full Name" value={form.name || ''} editKey="name" />
            {profile?.role === 'admin' && (
              <Field icon={Mail} label="Email Address" value={form.email || ''} editKey="email" />
            )}
            <Field icon={Phone} label="Phone Number" value={form.phone_number || ''} editKey="phone_number" />
            <SelectField 
              icon={User} 
              label="Gender" 
              value={form.gender || ''} 
              editKey="gender" 
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]}
            />
            <Field icon={Globe} label="Nationality" value={form.nationality || ''} editKey="nationality" />
            <Field icon={MapPin} label="Country" value={form.country || ''} editKey="country" />
            <Field icon={Building} label="Timezone" value={form.timezone || ''} editKey="timezone" />
            <Field icon={Globe} label="Language" value={form.language || ''} editKey="language" />
          </div>

          {/* Bio */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">About Me</h3>
            <Field icon={User} label="Bio" value={form.bio || ''} editKey="bio" />
          </div>

          {/* Academic/Professional Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Professional Information
            </h3>
            <Field icon={Building} label="Department" value={form.department || ''} editKey="department" />
            <Field icon={Globe} label="Institution" value={form.institution || ''} editKey="institution" />
            
            {profile?.role === 'student' && (
              <>
                <Field icon={GraduationCap} label="Year of Study" value={String(form.year_of_study || '')} editKey="year_of_study" type="number" />
                <Field icon={Award} label="Education Level" value={form.education_level || ''} editKey="education_level" />
              </>
            )}
          </div>

          {/* Instructor-specific fields */}
          {profile?.role === 'instructor' && profile?.instructor_profile && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" /> Instructor Details
              </h3>
              <Field icon={Award} label="Academic Rank" value={profile.instructor_profile.academic_rank?.replace('_', ' ') || ''} />
              <Field icon={Users} label="Employment Type" value={profile.instructor_profile.employment_type || ''} />
              <Field icon={Building} label="Office Location" value={profile.instructor_profile.office_location || ''} />
              <Field icon={Calendar} label="Office Hours" value={profile.instructor_profile.office_hours || ''} />
              <Field icon={Award} label="Highest Qualification" value={profile.instructor_profile.highest_qualification || ''} />
              <Field icon={Globe} label="Field of Specialization" value={profile.instructor_profile.field_of_specialization || ''} />
            </div>
          )}

          {/* My Courses - Instructors only */}
          {profile?.role === 'instructor' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">My Courses</h3>
              <div className="space-y-2">
                {myCourses.map(course => (
                  <div key={course.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{course.name}</p>
                      <p className="text-xs text-gray-400">{(course as unknown as Record<string,number>).enrolled_students ?? (course as unknown as Record<string,number>).enrolledStudents ?? 0} students</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(course as unknown as Record<string,string>).status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {(course as unknown as Record<string,string>).status}
                    </span>
                  </div>
                ))}
                {myCourses.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No courses yet</p>
                )}
              </div>
            </div>
          )}

          {/* Preferences */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Preferences</h3>
            <div className="space-y-3">
              {[
                { label: 'Email notifications', desc: 'Receive emails about course activities' },
                { label: 'Forum subscriptions', desc: 'Get notified of new forum posts' },
                { label: 'Grading reminders', desc: 'Remind me of pending tasks' },
                { label: 'AI suggestions', desc: 'Show AI-generated insights' },
              ].map(pref => (
                <label key={pref.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{pref.label}</p>
                    <p className="text-xs text-gray-400">{pref.desc}</p>
                  </div>
                  <div className="w-10 h-5 bg-indigo-600 rounded-full relative flex-shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
