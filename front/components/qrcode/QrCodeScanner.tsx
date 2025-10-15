import { useEffect, useRef } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Button } from "../ui/button";


type QrCodeProps = {
    dataHandler: (data: string) => void
    onCancel: () => void
}

export const QrCodeScanner = ({ dataHandler, onCancel }: QrCodeProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    const startQRScanner = async () => {
        if (!videoRef.current) return;

        try {
            const codeReader = new BrowserQRCodeReader();

            const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();

            // Filtrer les caméras virtuelles et préférer les caméras physiques
            const physicalCameras = videoInputDevices.filter(device =>
                !device.label.toLowerCase().includes('obs') &&
                !device.label.toLowerCase().includes('virtual') &&
                !device.label.toLowerCase().includes('screen') &&
                !device.label.toLowerCase().includes('snap')
            );

            // Préférer la caméra arrière (environment) ou la dernière caméra physique
            let selectedDeviceId: string | undefined;

            if (physicalCameras.length > 0) {
                // Chercher une caméra arrière
                const backCamera = physicalCameras.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('rear') ||
                    device.label.toLowerCase().includes('environment')
                );

                selectedDeviceId = backCamera
                    ? backCamera.deviceId
                    : physicalCameras[physicalCameras.length - 1].deviceId;
            } else if (videoInputDevices.length > 0) {
                selectedDeviceId = videoInputDevices[0].deviceId;
            }

            const controls = await codeReader.decodeFromVideoDevice(
                selectedDeviceId,
                videoRef.current,
                (result, error) => {
                    if (result) {
                        dataHandler(result.getText());
                        stopQRScanner();
                        if ("vibrate" in navigator) navigator.vibrate([200])
                    }
                    if (error && !(error.name === 'NotFoundException')) {
                        console.error(error);
                    }
                }
            );

            controlsRef.current = controls;
        } catch (error) {
            console.error("Error starting QR scanner:", error);
            alert("Unable to access the camera. Please check permissions.");
        }
    }

    const stopQRScanner = () => {

        // Arrêter manuellement le stream vidéo EN PREMIER
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach(track => {
                track.stop();
            });
            videoRef.current.srcObject = null;
        }

        // Arrêter les contrôles ZXing APRES
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }

    };

    useEffect(() => {

        const initScanner = async () => {
            await startQRScanner()
        }

        initScanner()

        return () => {
            stopQRScanner()
        }
    }, [])



    return (
        <>
            <div className="relative w-full max-w-md aspect-square bg-black rounded-lg overflow-hidden">
                <video
                    disablePictureInPicture={true}
                    disableRemotePlayback={true}
                    controlsList="nodownload nofullscreen noremoteplayback"
                    contextMenu="return false;"
                    playsInline={false}
                    ref={videoRef}
                    className="w-full h-full object-cover pointer-events-none select-none"
                />
                <div className="absolute inset-0 border-4 border-white opacity-50 m-8"></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
                Position the QR code in front of the camera.
            </p>
            <Button
                variant="outline"
                onClick={() => {
                    stopQRScanner()
                    setTimeout(() => {
                        onCancel()
                    }, 300)
                }}
            >Cancel</Button>
        </>
    )
}