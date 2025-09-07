import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Crop as CropIcon, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePhotoCropProps {
  userId: string;
  currentAvatarUrl?: string;
  onAvatarUpdate: (url: string) => void;
}

const ProfilePhotoCrop = ({ userId, currentAvatarUrl, onAvatarUpdate }: ProfilePhotoCropProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'upload' | 'crop' | 'preview'>('upload');
  const [previewUrl, setPreviewUrl] = useState('');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error", 
          description: "Image size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setStep('crop');
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Create a square crop centered on the image
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1, // aspect ratio 1:1 for square
        width,
        height,
      ),
      width,
      height,
    );
    
    setCrop(crop);
  }, []);

  const generatePreview = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = 200; // Fixed preview size
    canvas.height = 200;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Convert canvas to blob URL for preview
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStep('preview');
      }
    });
  }, [completedCrop]);

  const uploadCroppedImage = async () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return;

    setUploading(true);
    try {
      const canvas = previewCanvasRef.current;
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onAvatarUpdate(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Profile photo updated successfully"
      });

      // Reset and close
      setIsOpen(false);
      setStep('upload');
      setImgSrc('');
      setPreviewUrl('');
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetFlow = () => {
    setStep('upload');
    setImgSrc('');
    setPreviewUrl('');
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        {currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              {step === 'upload' && "Select an image to upload"}
              {step === 'crop' && "Crop your image to fit your profile"}
              {step === 'preview' && "Preview your new profile photo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {step === 'upload' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload">Choose Image</Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported formats: JPG, PNG, GIF. Maximum size: 5MB
                </p>
              </div>
            )}

            {step === 'crop' && imgSrc && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                  >
                    <img
                      ref={imgRef}
                      alt="Crop preview"
                      src={imgSrc}
                      style={{ maxHeight: 400, maxWidth: '100%' }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>
                <canvas
                  ref={previewCanvasRef}
                  style={{ display: 'none' }}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFlow} className="flex-1">
                    Choose Different Image
                  </Button>
                  <Button onClick={generatePreview} className="flex-1">
                    <CropIcon className="h-4 w-4 mr-2" />
                    Preview Crop
                  </Button>
                </div>
              </div>
            )}

            {step === 'preview' && previewUrl && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="text-center">
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full border-4 border-border object-cover mx-auto"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      This is how your profile photo will appear
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('crop')} className="flex-1">
                    Adjust Crop
                  </Button>
                  <Button 
                    onClick={uploadCroppedImage} 
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? 'Uploading...' : 'Save Photo'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePhotoCrop;