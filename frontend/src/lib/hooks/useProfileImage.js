import { useCallback, useEffect, useRef, useState } from 'react';

import api from '../api/api';

function useProfileImage(hasProfileImage, version = 0) {
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const objectUrlRef = useRef('');

  const clearImage = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
    setProfileImageUrl('');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileImage() {
      if (!hasProfileImage) {
        clearImage();
        return;
      }

      try {
        const response = await api.get('/users/me/profile-image', {
          responseType: 'blob',
        });
        if (cancelled) return;

        clearImage();
        const objectUrl = URL.createObjectURL(response.data);
        objectUrlRef.current = objectUrl;
        setProfileImageUrl(objectUrl);
      } catch (error) {
        if (!cancelled) {
          console.error('Profile image loading failed:', error);
          clearImage();
        }
      }
    }

    void loadProfileImage();
    return () => {
      cancelled = true;
    };
  }, [clearImage, hasProfileImage, version]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = '';
      }
    },
    [],
  );

  return profileImageUrl;
}

export default useProfileImage;
