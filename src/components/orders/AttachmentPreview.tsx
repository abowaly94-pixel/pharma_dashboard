import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, ReceiptText } from 'lucide-react';

interface PreviewData {
  type: 'prescription' | 'payment';
  url: string;
  title: string;
}

interface AttachmentPreviewProps {
  preview: PreviewData | null;
  onClose: () => void;
}

const typeConfig = {
  prescription: {
    label: 'روشتة الطلب',
    accent: 'from-emerald-500/20 to-emerald-600/20 border-emerald-200',
    icon: FileText,
  },
  payment: {
    label: 'إيصال الدفع',
    accent: 'from-blue-500/20 to-blue-600/20 border-blue-200',
    icon: ReceiptText,
  },
};

export function AttachmentPreview({ preview, onClose }: AttachmentPreviewProps) {
  const sanitizedUrl = preview?.url?.split('?')[0] ?? '';
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(sanitizedUrl);
  const isPdf = sanitizedUrl.toLowerCase().endsWith('.pdf');

  const config = preview ? typeConfig[preview.type] : typeConfig.prescription;
  const Icon = config.icon;

  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full border-none p-0" dir="rtl">
        {preview && (
          <div className="space-y-6">
            <div className="px-6 pt-6">
              <DialogHeader>
                <DialogTitle className="font-cairo text-2xl flex items-center gap-3">
                  <span className={`p-2 rounded-xl bg-gradient-to-br ${config.accent}`}>
                    <Icon className="w-5 h-5 text-foreground" />
                  </span>
                  {preview.title}
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="px-6">
              <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden shadow-inner">
                {isImage ? (
                  <img
                    src={preview.url}
                    alt={preview.title}
                    className="w-full h-[70vh] object-contain bg-background"
                    loading="lazy"
                  />
                ) : (
                  <iframe
                    src={preview.url}
                    title={preview.title}
                    className="w-full h-[70vh] bg-background"
                  />
                )}
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
