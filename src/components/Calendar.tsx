import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
// TODO: Add proper type definitions for react-big-calendar
// @ts-ignore
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-hot-toast';
import { Plus, CheckCircle, Users, MapPin, Gift, Calendar as CalendarIcon, Trash2 } from 'lucide-react';

const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description: string;
  isEvent: boolean;
  location?: string;
  createdBy: string;
  rsvp?: {
    [userId: string]: { status: 'yes' | 'maybe'; name: string };
  };
}

interface FirestoreEvent extends Omit<Event, 'start' | 'end'> {
  start: Timestamp;
  end: Timestamp;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id' | 'rsvp' | 'createdBy'>>({
    title: '',
    start: new Date(),
    end: new Date(),
    allDay: true,
    description: '',
    isEvent: false,
    location: '',
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [blessing, setBlessing] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'));
      const querySnapshot = await getDocs(q);
      const fetchedEvents: Event[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreEvent;
        fetchedEvents.push({
          ...data,
          id: doc.id,
          start: data.start.toDate(),
          end: data.end.toDate(),
        });
      });
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events. Please try again.');
    }
  };

  const handleAddEvent = async () => {
    if (!user) {
      toast.error('Please sign in to add events.');
      return;
    }
    try {
      const eventData: any = {
        ...newEvent,
        createdBy: user.uid,
        start: Timestamp.fromDate(newEvent.start),
        end: Timestamp.fromDate(newEvent.end),
      };

      // Only add the rsvp field if it's an event, not an important date
      if (newEvent.isEvent) {
        eventData.rsvp = {};
      }

      const docRef = await addDoc(collection(db, 'events'), eventData);
      const addedEvent: Event = {
        ...eventData,
        id: docRef.id,
        start: newEvent.start,
        end: newEvent.end,
      };
      setEvents([...events, addedEvent]);
      setNewEvent({
        title: '',
        start: new Date(),
        end: new Date(),
        allDay: true,
        description: '',
        isEvent: false,
        location: '',
      });
      setShowEventForm(false);
      toast.success('Event added successfully! 🎉');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event. Please try again. 😞');
    }
  };

  const handleRSVP = async (eventId: string, response: 'yes' | 'maybe') => {
    if (!user) {
      toast.error('Please sign in to RSVP.');
      return;
    }
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        [`rsvp.${user.uid}`]: { status: response, name: user.displayName || 'Anonymous' },
      });
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, rsvp: { ...event.rsvp, [user.uid]: { status: response, name: user.displayName || 'Anonymous' } } }
          : event
      ));
      toast.success(`You've RSVP'd ${response} to the event! 👍`);
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({
          ...selectedEvent,
          rsvp: { ...selectedEvent.rsvp, [user.uid]: { status: response, name: user.displayName || 'Anonymous' } },
        });
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP. Please try again. 😞');
    }
  };
  const handleSendBlessing = async () => {
    if (!user || !selectedEvent) {
      toast.error('Please sign in to send a blessing.');
      return;
    }
    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL,
        text: '',
        createdAt: Timestamp.now(),
        likes: [],
        comments: [],
        tags: [],
        isBlessing: true,
        blessingText: blessing,
        eventId: selectedEvent.id, // Add this line to associate the blessing with the event
      });
      toast.success('Blessing sent and added to the feed!');
      setBlessing('');
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error sending blessing:', error);
      toast.error('Failed to send blessing. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) {
      toast.error('Please sign in to delete events.');
      return;
    }
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists() && eventDoc.data().createdBy === user.uid) {
        await deleteDoc(doc(db, 'events', eventId));
        setEvents(events.filter(event => event.id !== eventId));
        setSelectedEvent(null);
        toast.success('Event deleted successfully!');
      } else {
        toast.error('You do not have permission to delete this event.');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event. Please try again.');
    }
  };

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = event.isEvent ? '#3174ad' : '#4CAF50';
    if (user && event.rsvp && event.rsvp[user.uid]) {
      switch (event.rsvp[user.uid].status) {
        case 'yes':
          backgroundColor = '#4CAF50';
          break;
        case 'maybe':
          backgroundColor = '#FFC107';
          break;
      }
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const renderRSVPList = (event: Event) => {
    const attendees = {
      yes: [] as { name: string }[],
      maybe: [] as { name: string }[],
    };

    if (event.rsvp) {
      Object.entries(event.rsvp).forEach(([userId, { status, name }]) => {
        if (status === 'yes' || status === 'maybe') {
          attendees[status].push({ name });
        }
      });
    }

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <Users size={18} className="mr-2" />
          Attendees
        </h4>
        <div className="space-y-2">
          <div>
            <h5 className="font-medium">Attending:</h5>
            {attendees.yes.length > 0 ? (
              <ul className="list-disc list-inside">
                {attendees.yes.map((attendee, index) => (
                  <li key={index}>{attendee.name}</li>
                ))}
              </ul>
            ) : (
              <p>No one yet</p>
            )}
          </div>
          <div>
            <h5 className="font-medium">Maybe:</h5>
            {attendees.maybe.length > 0 ? (
              <ul className="list-disc list-inside">
                {attendees.maybe.map((attendee, index) => (
                  <li key={index}>{attendee.name}</li>
                ))}
              </ul>
            ) : (
              <p>No one yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container p-4 bg-white min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-800">Family Calendar</h2>
      <div className="mb-6 bg-gray-100 p-6 rounded-lg shadow-lg">
        <button
          onClick={() => setShowEventForm(!showEventForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition duration-300 flex items-center"
        >
          <Plus size={20} className="mr-2" />
          {showEventForm ? 'Hide Event Form' : 'Add New Event'}
        </button>
        {showEventForm && (
          <div className="mt-4 space-y-4">
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event Title"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Event Description"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <div className="flex space-x-4">
              <input
                type="date"
                value={moment(newEvent.start).format('YYYY-MM-DD')}
                onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value), end: new Date(e.target.value) })}
                className="w-1/2 p-2 border border-gray-300 rounded-lg"
              />
              <select
                value={newEvent.isEvent ? 'event' : 'mention'}
                onChange={(e) => setNewEvent({ ...newEvent, isEvent: e.target.value === 'event' })}
                className="w-1/2 p-2 border border-gray-300 rounded-lg"
              >
                <option value="event">Event</option>
                <option value="mention">Important Date</option>
              </select>
            </div>
            {newEvent.isEvent && (
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Event Location"
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            )}
            <button
              onClick={handleAddEvent}
              className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Add to Calendar
            </button>
          </div>
        )}
      </div>
      <div className="calendar-wrapper bg-white rounded-lg shadow-lg overflow-hidden">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event: Event) => setSelectedEvent(event)}
          onSelectSlot={(slotInfo: { start: Date; end: Date }) => {
            setNewEvent({
              ...newEvent,
              start: slotInfo.start,
              end: slotInfo.end,
            });
            setShowEventForm(true);
          }}
          selectable
        />
      </div>
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-2xl w-full mx-4 shadow-xl">
            <h3 className="font-bold text-2xl mb-4">{selectedEvent.title}</h3>
            <p className="mb-4 text-gray-600">{selectedEvent.description}</p>
            <p className="mb-4 flex items-center text-gray-600">
              <CalendarIcon size={18} className="mr-2" />
              {moment(selectedEvent.start).format('MMMM D, YYYY')}
            </p>
            {selectedEvent.isEvent && selectedEvent.location && (
              <p className="mb-4 flex items-center text-gray-600">
                <MapPin size={18} className="mr-2" />
                {selectedEvent.location}
              </p>
            )}
            {selectedEvent.isEvent ? (
              <>
                {renderRSVPList(selectedEvent)}
                {user && (
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => handleRSVP(selectedEvent.id, 'yes')} className="bg-green-500 text-white px-6 py-2 rounded-lg flex items-center hover:bg-green-600 transition duration-300">
                      <CheckCircle size={18} className="mr-2" /> Attending
                    </button>
                    <button onClick={() => handleRSVP(selectedEvent.id, 'maybe')} className="bg-yellow-500 text-white px-6 py-2 rounded-lg flex items-center hover:bg-yellow-600 transition duration-300">
                      <CheckCircle size={18} className="mr-2" /> Maybe
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6">
                <textarea
                  value={blessing}
                  onChange={(e) => setBlessing(e.target.value)}
                  placeholder="Write a blessing or note..."
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
                <button 
                  onClick={handleSendBlessing}
                  className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300 flex items-center justify-center"
                >
                  <Gift size={18} className="mr-2" /> Send Blessing
                </button>
              </div>
            )}
            {user && selectedEvent.createdBy === user.uid && (
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="mt-4 w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 flex items-center justify-center"
              >
                <Trash2 size={18} className="mr-2" /> Delete Event
              </button>
            )}
            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-4 w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;