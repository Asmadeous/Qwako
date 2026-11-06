import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader2, PenSquare, Upload } from 'lucide-react';
import { useAuth } from '../../../hooks';

const EditProfileDialog = () => {
  const { user, updateProfile } = useAuth();
  const uploadRef = useRef(null);
  const [picture, setPicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [userData, setUserData] = useState({
    name: user.name,
    current_password: '',
    password: '',
    confirm_password: '',
  });

  const handleImageClick = () => {
    uploadRef.current.click();
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) setPicture(file);
  };

  const handleUserData = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSaveChanges = async (e) => {
    e?.preventDefault();
    if (loading) return;
    const { name, current_password, password, confirm_password } = userData;
    setErrors({});
    setFormError('');

    if (name.trim() === '') {
      setErrors({ name: "Name can't be blank" });
      return;
    }
    if (password !== confirm_password) {
      setErrors({ confirm_password: "Passwords don't match" });
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    if (picture) formData.append('avatar', picture);
    if (password) {
      formData.append('current_password', current_password);
      formData.append('password', password);
    }

    setLoading(true);
    const res = await updateProfile(formData);
    setLoading(false);
    if (res.success) {
      setPicture(null);
      setUserData((current) => ({ ...current, current_password: '', password: '', confirm_password: '' }));
      toast.success('Profile updated.');
      return;
    }
    setErrors(res.fieldErrors || {});
    setFormError(res.message);
  };

  const errorFor = (field) =>
    errors[field] && (
      <p id={`${field}-error`} className="col-span-3 col-start-2 text-sm text-red-700">
        {errors[field]}
      </p>
    );
  const invalid = (field) => ({
    'aria-invalid': errors[field] ? 'true' : undefined,
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-ink text-sand hover:bg-ink/90">
          <PenSquare className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <div className="flex justify-center">
          <div className="relative h-40 w-40 cursor-pointer overflow-hidden rounded-full bg-gray-200">
            <div
              className="absolute flex h-full w-full items-center justify-center bg-gray-200 hover:z-10"
              onClick={handleImageClick}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Profile photo"
                className="hidden"
                ref={uploadRef}
                onChange={handlePictureChange}
              />
              <Upload height={50} width={50} color="#4e4646" />
            </div>

            {/* Display user avatar based on picture state */}
            {picture ? (
              <Avatar className="transition-all ease-in-out hover:z-0 hover:hidden ">
                <AvatarImage src={URL.createObjectURL(picture)} />
              </Avatar>
            ) : (
              <Avatar className="transition-all ease-in-out hover:z-0 hover:hidden ">
                <AvatarImage src={user.avatar_url} />
              </Avatar>
            )}
          </div>
        </div>

        {/* Update form */}
        {formError && (
          <p role="alert" className="text-sm text-red-700">
            {formError}
          </p>
        )}
        {errorFor('avatar')}
        <form id="edit-profile-form" onSubmit={handleSaveChanges} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={userData.name}
              className="col-span-3"
              autoComplete="name"
              onChange={handleUserData}
              {...invalid('name')}
            />
            {errorFor('name')}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current_password" className="text-right">
              Current Password
            </Label>
            <Input
              id="current_password"
              name="current_password"
              value={userData.current_password}
              className="col-span-3"
              type="password"
              autoComplete="current-password"
              onChange={handleUserData}
              {...invalid('current_password')}
            />
            {errorFor('current_password')}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              New Password
            </Label>
            <Input
              id="password"
              name="password"
              value={userData.password}
              className="col-span-3"
              type="password"
              autoComplete="new-password"
              onChange={handleUserData}
              {...invalid('password')}
            />
            {errorFor('password')}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirm_password" className="text-right">
              Confirm Password
            </Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              value={userData.confirm_password}
              className="col-span-3"
              type="password"
              autoComplete="new-password"
              onChange={handleUserData}
              {...invalid('confirm_password')}
            />
            {errorFor('confirm_password')}
          </div>
        </form>
        <DialogFooter>
          <Button
            disabled={loading}
            type="submit"
            form="edit-profile-form"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
