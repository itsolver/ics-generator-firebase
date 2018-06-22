const functions = require('firebase-functions');
var http = require('http');
var url = require('url');
var fs = require('fs');
var underscore = require('underscore');
const express = require('express');
var templateString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//<%= host %><% if(name) { %>
X-WR-CALNAME:<%= name %><% } %>
X-WR-TIMEZONE:<%= timezone %>
BEGIN:VEVENT
DTSTAMP:<%= now %>
UID:<%= uid %><% if (allDay) { %>
DTSTART;VALUE=DATE:<%= startDate %>
DTEND;VALUE=DATE:<%= endDate %><% } else { %>
DTSTART;TZID=<%= timezone %>:<%= startDate %>
DTEND;TZID=<%= timezone %>:<%= endDate %><% } %>
SUMMARY:<%= summary %>
DESCRIPTION:<%= description %>
LOCATION:<%= location %><% if(rrule) { %>
RRULE:<%= rrule %><% } %>
END:VEVENT
END:VCALENDAR`;
const host = 'ics.itsolver.net';

var template = underscore.template(templateString);

const app = express();
app.get('*', (req, res) => {
  var params = url.parse(req.url, true).query;

  var options = {
    host: host,
    timezone: params.tz,
    summary: params.summary,
    description: params.description,
    location: params.location,
    name: params.name,
    allDay: params.all_day,
    fileName: params.file_name,
    rrule: params.rrule
  };

  if (options.allDay) {
    options.startDate = formatDate(new Date(params.start));
    options.endDate = params.end ? formatDate(new Date(params.end)) : options.startDate;
  } else {
    options.startDate = formatDatetime(new Date(params.start));
    options.endDate = params.end ? formatDatetime(new Date(params.end)) : options.startDate;
  }

  options.uid = (new Date()).getTime() + "@" + host;
  options.now = formatDate(new Date());
  options.fileName = sanitizeFileName(options.fileName || '');
  if (!options.fileName.length) {
    options.fileName = 'Event';
  }

  var output = template(options);

  res.writeHead(200, {
    'Content-Type': 'text/calendar',
    'Content-Disposition': `attachment; filename="${options.fileName}.ics"`
  });
  res.end(output);
});
exports.app = functions.https.onRequest(app);

function formatDatetime(d) {
  return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
}

function formatDate(d) {
  return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
}

function sanitizeFileName(filename) {
  return filename.replace(/[^A-Za-z0-9_\-.]/g, ()=>'');
}

function pad2(i) {
  if(i < 10) {
    return "0" + i;
  } else {
    return String(i);
  }
}