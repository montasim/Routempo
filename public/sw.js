self.addEventListener("push", (event) => {
  const payload = event.data
    ? event.data.json()
    : {
        title: "Routempo reminder",
        body: "A routine needs your attention.",
        url: "/today",
      }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/logo.svg",
      badge: "/logo.svg",
      tag: payload.deliveryKey,
      data: { url: payload.url || "/today" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = new URL(
    event.notification.data?.url || "/today",
    self.location.origin
  )

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (new URL(client.url).origin === target.origin) {
            client.navigate(target.href)
            return client.focus()
          }
        }
        return self.clients.openWindow(target.href)
      })
  )
})
