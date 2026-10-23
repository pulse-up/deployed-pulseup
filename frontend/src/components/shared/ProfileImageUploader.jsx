import { useRef, useState } from 'react';

import api from '../../lib/api/api';
import '../../styles/components/shared/ProfileImageUploader.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

function initials(name) {
  return String(name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function ProfileImageUploader({
  hasProfileImage = false,
  imageUrl,
  name,
  onChanged,
}) {
  const inputRef = useRef(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage('Choose a JPEG or PNG image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage('The image must be 5 MB or smaller.');
      return;
    }

    try {
      setWorking(true);
      setMessage('');
      const formData = new FormData();
      formData.append('image', file);
      await api.put('/users/me/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChanged?.(true);
      setMessage('Profile image updated.');
    } catch (error) {
      console.error('Profile image upload failed:', error);
      setMessage('The image could not be uploaded. Use a valid JPEG or PNG.');
    } finally {
      setWorking(false);
    }
  }

  async function handleRemove() {
    try {
      setWorking(true);
      setMessage('');
      await api.delete('/users/me/profile-image');
      onChanged?.(false);
      setMessage('Profile image removed.');
    } catch (error) {
      console.error('Profile image removal failed:', error);
      setMessage('The profile image could not be removed.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="profile-image-uploader" aria-labelledby="profile-photo-heading">
      <div className="profile-image-uploader__preview" aria-hidden="true">
        {imageUrl ? <img src={imageUrl} alt="" /> : <span>{initials(name)}</span>}
      </div>
      <div className="profile-image-uploader__content">
        <strong id="profile-photo-heading">Profile image</strong>
        <p>Upload a clear JPEG or PNG. PulseUp securely crops it to a square and removes embedded metadata.</p>
        <div className="profile-image-uploader__actions">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={working}
            hidden
          />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={working}>
            {working ? 'Updating…' : hasProfileImage ? 'Change image' : 'Upload image'}
          </button>
          {hasProfileImage && (
            <button type="button" className="is-remove" onClick={handleRemove} disabled={working}>
              Remove
            </button>
          )}
        </div>
        {message && <small role="status">{message}</small>}
      </div>
    </section>
  );
}

export default ProfileImageUploader;
