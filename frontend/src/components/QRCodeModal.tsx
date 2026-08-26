import React, { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { LuQrCode, LuCopy, LuCheck, LuDownload, LuX, LuExternalLink } from "react-icons/lu";

interface QRCodeModalProps {
  passportId: bigint | number;
  dppId?: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  passportId,
  dppId,
  productName,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const idStr = passportId.toString();
  const displayId = dppId || idStr;
  const verifyUrl = `${window.location.origin}/verify/${displayId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `passport-${displayId}-qrcode.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="card-base"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "var(--shadow-lg)",
          textAlign: "center",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            color: "var(--text-secondary)",
            fontSize: "1.25rem",
            padding: "0.25rem",
          }}
          aria-label="Close"
        >
          <LuX />
        </button>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(113, 135, 168, 0.15)",
            color: "var(--accent-primary)",
            fontSize: "24px",
            marginBottom: "1rem",
          }}
        >
          <LuQrCode />
        </div>

        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: "0.25rem",
          }}
        >
          Digital Product Passport QR
        </h3>

        <p
          className="text-secondary"
          style={{
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}
        >
          {productName} ({displayId})
        </p>

        {/* QR Code Canvas */}
        <div
          ref={canvasRef}
          style={{
            display: "inline-block",
            padding: "1rem",
            background: "#ffffff",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.25rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <QRCodeCanvas
            value={verifyUrl}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            wordBreak: "break-all",
            fontFamily: "var(--font-mono)",
            background: "var(--bg-card)",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "1.25rem",
          }}
        >
          {verifyUrl}
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleCopy}
            className="btn btn-secondary"
            style={{
              flex: 1,
              padding: "0.6rem 1rem",
              fontSize: "0.85rem",
              color: copied ? "var(--status-success)" : "var(--text-primary)",
              borderColor: copied ? "var(--status-success)" : "var(--border-default)",
            }}
          >
            {copied ? <LuCheck /> : <LuCopy />}
            {copied ? "Copied Link!" : "Copy Link"}
          </button>

          <button
            onClick={handleDownload}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: "0.6rem 1rem",
              fontSize: "0.85rem",
            }}
          >
            <LuDownload /> Download PNG
          </button>
        </div>

        <div style={{ marginTop: "1.15rem" }}>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.8rem",
              color: "var(--accent-primary)",
            }}
          >
            Open verification page <LuExternalLink />
          </a>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
