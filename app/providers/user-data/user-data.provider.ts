import {Injectable} from '@angular/core';
import {Storage, LocalStorage} from 'ionic-angular';

@Injectable()
export class UserData {
  private DEFAULT_RADIUS:number;
  private EXACT_PRECISION:number;
  private FUZZY_PRECISION:number;
  private data:any;
  private localStorage:any;

  constructor() {
    this.localStorage = new Storage(LocalStorage);
    this.DEFAULT_RADIUS = 15;
    this.EXACT_PRECISION = 7;
    this.FUZZY_PRECISION = 2;
    this.data = {
      'id': null,
      'display_name': null,
      'team': null,
      'friend_code': null,
      'radius': null,
      'friends': [],
      'coordinates': {
        'latitude': null,
        'longitude': null
      },
      'block_list': [],
      'is_block_list_stale': false,
      'is_friend_list_stale': false
    };
  }

  setId(id) {
    this.data.id = id;
    this.localStorage.set('user-id', id);
  };

  setDisplayName(displayName) {
    this.data.display_name = displayName;
    this.localStorage.set('display-name', displayName);
  };

  setTeam(team) {
    this.data.team = team;
    this.localStorage.set('team', team);
  };

  setFriendCode(friendCode) {
    this.data.friend_code = friendCode;
    this.localStorage.set('friend-code', friendCode);
  };

  setRadius(radius) {
    this.data.radius = parseInt(radius, 10);
    this.localStorage.set('radius', radius);
  };

  setFriends(friends) {
    this.data.friends = friends;
  };

  setCoordinates(coordinates) {
    this.data.coordinates.latitude = coordinates[0];
    this.data.coordinates.longitude = coordinates[1];
  };

  setLatitude(lat) {
    this.data.coordinates.latitude = Number(lat);
    this.localStorage.set('latitude', lat);
  };


  setLongitude(long) {
    this.data.coordinates.longitude = Number(long);
    this.localStorage.set('longitude', long);
  };

  setBlockList(blockList) {
    this.data.block_list = blockList;
  };

  setIsBlockListStale(isStale:boolean) {
    this.data.is_block_list_stale = isStale;
  };

  setIsFriendListStale(isStale:boolean) {
    this.data.is_friend_list_stale = isStale;
  };

  getId() {
    if (this.data.id === null && this.localStorage.get('user-id') !== null) {
      return this.localStorage.get('user-id');
    }
    return this.data.id;
  };

  getDisplayName() {
    if (this.data.display_name === null && this.localStorage.get('display-name') !== null) {
      return this.localStorage.get('display-name');
    }
    return this.data.display_name;
  };

  getTeam() {
    if (this.data.team === null && this.localStorage.get('team') !== null) {
      return this.localStorage.get('team');
    }
    return this.data.team;
  };

  getFriendCode() {
    if (this.data.friend_code === null && this.localStorage.get('friend-code') !== null) {
      return this.localStorage.get('friend-code');
    }
    return this.data.friend_code;
  };

  getRadius() {
    if (this.data.radius === null && this.localStorage.get('radius') !== null) {
      return parseInt(this.localStorage.get('radius'), 10);
    }
    return this.data.radius === null ? this.DEFAULT_RADIUS : Number(this.data.radius);
  };

  getFriends() {
    return this.data.friends;
  };

  getLatitude() {
    if (this.data.latitude === null && this.localStorage.get('latitude') !== null) {
      return +this.localStorage.get('latitude').toFixed(this.EXACT_PRECISION);
    }
    return +this.data.coordinates.latitude.toFixed(this.EXACT_PRECISION);
  };

  getLongitude() {
    if (this.data.longitude === null && this.localStorage.get('longitude') !== null) {
      return +this.localStorage.get('longitude').toFixed(this.EXACT_PRECISION);
    }
    return +this.data.coordinates.longitude.toFixed(this.EXACT_PRECISION);
  };

  getFuzzyLatitude() {
    if (this.data.latitude === null && this.localStorage.get('latitude') !== null) {
      return +this.localStorage.get('fuzzy-latitude').toFixed(this.FUZZY_PRECISION);
    }
    return +this.data.coordinates.latitude.toFixed(this.FUZZY_PRECISION);
  };

  getFuzzyLongitude() {
    if (this.data.longitude === null && this.localStorage.get('longitude') !== null) {
      return +this.localStorage.get('fuzzy-longitude').toFixed(this.FUZZY_PRECISION);
    }
    return +this.data.coordinates.longitude.toFixed(this.FUZZY_PRECISION);
  };

  getBlockList() {
    return this.data.block_list;
  };

  getIsBlockListStale() {
    return this.data.is_block_list_stale;
  };

  getIsFriendListStale() {
    return this.data.is_friend_list_stale;
  };
}

