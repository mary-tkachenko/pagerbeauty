// ------- Imports -------------------------------------------------------------

// ------- Internal imports ----------------------------------------------------

import { URL, URLSearchParams } from 'url';

import moment from 'moment';

import { INCLUDE_USERS } from './PagerDutyClient';

// ------- OnCall --------------------------------------------------------------

export class OnCall {
  constructor({
    scheduleId,
    scheduleName,
    scheduleURL,
    userId,
    userName,
    userAvatarURL,
    userURL,
    dateStart,
    dateEnd,
  }) {
    this.scheduleId = scheduleId;
    this.scheduleName = scheduleName;
    this.scheduleURL = scheduleURL;
    this.userId = userId;
    this.userName = userName;
    this.userAvatarURL = userAvatarURL;
    this.userURL = userURL;
    this.dateStart = dateStart;
    this.dateEnd = dateEnd;
  }

  serialize() {
    return {
      scheduleId: this.scheduleId,
      scheduleName: this.scheduleName,
      scheduleURL: this.scheduleURL,
      userId: this.userId,
      userName: this.userName,
      userAvatarURL: this.userAvatarURL,
      userURL: this.userURL,
      dateStart: this.dateStart.utc(),
      dateEnd: this.dateEnd.utc(),
    };
  }

  userAvatarSized(size = 2048) {
    const url = new URL(this.userAvatarURL);
    const searchParams = new URLSearchParams(url.searchParams);
    searchParams.append('s', size);
    url.search = searchParams;
    return url.href;
  }

  static fromApiRecord(record) {
    const attributes = {
      scheduleId: record.schedule.id,
      scheduleName: record.schedule.summary,
      scheduleURL: record.schedule.html_url,
      userId: record.user.id,
      userName: record.user.name,
      userAvatarURL: record.user.avatar_url,
      userURL: record.user.html_url,
      dateStart: moment(record.start),
      dateEnd: moment(record.end),
    };
    return new OnCall(attributes);
  }
  // ------- Class end  --------------------------------------------------------
}

// ------- SchedulesService -----------------------------------------------------

export class SchedulesService {
  constructor(pagerDutyClient) {
    this.client = pagerDutyClient;
    this.onCallRepo = new Map();
  }

  async load(scheduleIds) {
    let records;
    try {
      records = await this.client.oncalls(scheduleIds, new Set([INCLUDE_USERS]));
    } catch (e) {
      // console.log(e);
      throw e;
    }

    for (const record of records) {
      const oncall = OnCall.fromApiRecord(record);
      if (oncall.scheduleId) {
        this.onCallRepo.set(oncall.scheduleId, oncall);
      }
    }
  }

  serialize() {
    return Array.from(this.onCallRepo.values(), r => r.serialize());
  }
  // ------- Class end  --------------------------------------------------------
}

// ------- End -----------------------------------------------------------------
