var calendarId = 'PUT_CALENDAR_ID_HERE';


function importEventsFromRSS() {
  // Fetch the RSS feed 
  var response = UrlFetchApp.fetch('https://decaturmakers.app.neoncrm.com/np/feed?orgId=decaturmakers');
  var feed = XmlService.parse(response.getContentText()).getRootElement().getChild('channel');

  // Loop through the events in the feed and add them to the calendar
  var events = feed.getChildren('item');
  var addedEvents = [];
  for (var i = 0; i < events.length; i++) {
    var event = events[i];

    // Extract the event details from the RSS feed
    var title = event.getChildText('title');
    var description = event.getChildText('description');
    var location = event.getChildText('location');
    var startDate = new Date(Date.parse(event.getChildText('pubDate')));
    var endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Set the end time to one hour after the start time

    // Check if the event already exists in the calendar
    var existingEvent = getDuplicateEvent(title, startDate, endDate, addedEvents);
    if (existingEvent) {
      Logger.log('Deleting duplicate event: ' + title + ' - ' + startDate);
      existingEvent.deleteEvent();
    }

    // Add the event to the calendar
    var calendarEvent = CalendarApp.getCalendarById(calendarId).createEvent(title, startDate, endDate, {
      description: description,
      location: location
    });
    addedEvents.push(calendarEvent);
    Logger.log('Event created: ' + calendarEvent.getId() + ' - ' + calendarEvent.getTitle());
  }

  // Delete events that are over a week old
  var now = new Date();
  var oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  var eventsToDelete = CalendarApp.getCalendarById(calendarId).getEvents(oneWeekAgo, now);
  for (var i = 0; i < eventsToDelete.length; i++) {
    var event = eventsToDelete[i];
    event.deleteEvent();
    Logger.log('Deleted event: ' + event.getId() + ' - ' + event.getTitle());
  }
}

function getDuplicateEvent(title, startDate, endDate, addedEvents) {
  // Check if an event with the same title and start time already exists in the addedEvents array
  for (var i = 0; i < addedEvents.length; i++) {
    var event = addedEvents[i];
    if (event.getTitle() == title && event.getStartTime().getTime() == startDate.getTime()) {
      return event;
    }
  }

  // Check if an event with the same title and start time already exists in the calendar
  var events = CalendarApp.getCalendarById(calendarId).getEvents(startDate, endDate);
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (event.getTitle() == title && event.getStartTime().getTime() == startDate.getTime()) {
      return event;
    }
  }

  return null;
}
