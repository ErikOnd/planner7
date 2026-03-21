self.addEventListener("push", (event) => {
	let data = {};
	try {
		data = event.data?.json() ?? {};
	} catch {
		data = { body: event.data?.text() ?? "You have a reminder" };
	}
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
