export type PushState =
  | "loading"
  | "unsupported"
  | "unconfigured"
  | "denied"
  | "available"
  | "subscribed"
  | "error"

type PushConfiguration = {
  configured: boolean
  publicKey: string | null
}

function supported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

async function configuration() {
  const response = await fetch("/api/push")
  if (!response.ok) throw new Error("Could not load notification settings.")
  return (await response.json()) as PushConfiguration
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" })
}

export async function currentPushState(): Promise<PushState> {
  if (!supported()) return "unsupported"
  const config = await configuration()
  if (!config.configured || !config.publicKey) return "unconfigured"
  if (Notification.permission === "denied") return "denied"

  const existing = await (await registration()).pushManager.getSubscription()
  if (!existing) return "available"
  await saveSubscription(existing)
  return "subscribed"
}

export async function enablePushNotifications() {
  if (!supported())
    throw new Error("This browser does not support push notifications.")

  const config = await configuration()
  if (!config.configured || !config.publicKey)
    throw new Error("Push notifications are not configured on this server.")

  const permission = await Notification.requestPermission()
  if (permission !== "granted")
    throw new Error(
      permission === "denied"
        ? "Notification permission is blocked in your browser settings."
        : "Notification permission was not granted."
    )

  const worker = await registration()
  const existing = await worker.pushManager.getSubscription()
  const subscription =
    existing ??
    (await worker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(config.publicKey),
    }))

  try {
    await saveSubscription(subscription)
  } catch (error) {
    if (!existing) await subscription.unsubscribe()
    throw error
  }
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  })
  if (!response.ok)
    throw new Error(
      await responseError(response, "Could not enable reminders.")
    )
}

export async function disablePushNotifications() {
  if (!supported()) return
  const subscription = await (
    await registration()
  ).pushManager.getSubscription()
  if (!subscription) return

  const response = await fetch("/api/push", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })
  if (!response.ok)
    throw new Error(
      await responseError(response, "Could not disable reminders.")
    )
  await subscription.unsubscribe()
}

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    error?: string
  } | null
  return body?.error ?? fallback
}

function decodeApplicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}
