self.addEventListener("push", (event) => {
	const data = event.data?.json() ?? {};
	event.waitUntil(
		self.registration.showNotification(data.title ?? "Planner7", {
			body: data.body ?? "You have a reminder",
			icon: "/icon-192.png",
			badge: "/icon-192.png",
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(clients.openWindow("/"));
});
