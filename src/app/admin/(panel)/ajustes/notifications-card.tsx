"use client";

import { BellIcon, BellOffIcon, SendIcon, ShareIcon, SquarePlusIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { removePushSubscription, savePushSubscription, sendTestPush } from "./notification-actions";

type Status = "checking" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function deviceLabel() {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  return "Computadora";
}

function isIos() {
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && "ontouchend" in document)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function registerWorker() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/admin", updateViaCache: "none" });
}

async function saveSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return savePushSubscription({
    endpoint: json.endpoint ?? subscription.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
    label: deviceLabel(),
  });
}

/** Turns on push notifications (new answer, change or wish) on the current device. */
export function NotificationsCard({ deviceCount }: { deviceCount: number }) {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    const check = async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        if (active) setStatus(isIos() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      const registration = await registerWorker();
      const subscription = await registration.pushManager.getSubscription();
      if (!active) return;
      if (Notification.permission === "denied") setStatus("denied");
      else if (subscription) {
        setStatus("on");
        await saveSubscription(subscription); // in case it was removed from the server
      } else setStatus("off");
    };
    check().catch(() => active && setStatus("unsupported"));
    return () => {
      active = false;
    };
  }, []);

  const enable = () =>
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "off");
          return;
        }
        const registration = await registerWorker();
        await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        });
        const result = await saveSubscription(subscription);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setStatus("on");
        toast.success(result.message);
        await sendTestPush();
      } catch {
        toast.error("Este navegador no permitió activar los avisos.");
      }
    });

  const disable = () =>
    startTransition(async () => {
      const registration = await navigator.serviceWorker.getRegistration("/admin");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("off");
      toast.success("Avisos desactivados en este dispositivo");
    });

  const test = () =>
    startTransition(async () => {
      const result = await sendTestPush();
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    });

  return (
    <div className="grid gap-4 text-sm">
      <p className="text-muted-foreground">
        Te avisamos al instante cuando alguien confirme, cambie su respuesta o deje un deseo.
        {deviceCount > 0 && ` Dispositivos activos: ${deviceCount}.`}
      </p>

      {status === "checking" && <div className="h-9 animate-pulse rounded-lg bg-muted" />}

      {status === "ios-install" && (
        <ol className="grid gap-2 rounded-lg bg-accent/60 p-3">
          <li className="flex gap-2">
            <ShareIcon className="mt-0.5 size-4 shrink-0" /> 1. En Safari toca <strong>Compartir</strong>.
          </li>
          <li className="flex gap-2">
            <SquarePlusIcon className="mt-0.5 size-4 shrink-0" /> 2. Elige <strong>Agregar a pantalla de inicio</strong>
            .
          </li>
          <li className="flex gap-2">
            <BellIcon className="mt-0.5 size-4 shrink-0" /> 3. Abre <strong>Mi boda</strong> desde el ícono, entra a
            Ajustes y activa los avisos aquí.
          </li>
        </ol>
      )}

      {status === "unsupported" && (
        <p className="rounded-lg bg-muted px-3 py-2">
          Este navegador no admite avisos. En Android usa Chrome; en iPhone, agrega el panel a la pantalla de inicio.
        </p>
      )}

      {status === "denied" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
          Los avisos están bloqueados para este sitio. Actívalos en los ajustes del navegador y vuelve a intentarlo.
        </p>
      )}

      {status === "off" && (
        <Button onClick={enable} disabled={pending} className="justify-self-start">
          <BellIcon /> {pending ? "Activando…" : "Activar avisos en este dispositivo"}
        </Button>
      )}

      {status === "on" && (
        <div className="grid gap-2">
          <p className="flex items-center gap-2 font-medium text-success">
            <BellIcon className="size-4" /> Este dispositivo recibe avisos
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={test} disabled={pending}>
              <SendIcon /> Enviar aviso de prueba
            </Button>
            <Button variant="ghost" size="sm" onClick={disable} disabled={pending}>
              <BellOffIcon /> Desactivar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
