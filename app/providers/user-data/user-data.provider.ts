import {Injectable} from '@angular/core';
import {Storage, LocalStorage} from 'ionic-angular';

@Injectable()
export class UserData {
  private DEFAULT_RADIUS: number;
  private EXACT_PRECISION: number;
  private FUZZY_PRECISION: number;
  private data: any;
  private localStorage: any;

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

  clearData() {
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
    this.localStorage.clear();
  }

  setId(id: string) {
    this.data.id = id;
    this.localStorage.set('user-id', id);
  };

  setDisplayName(displayName: string) {
    this.data.display_name = displayName;
    this.localStorage.set('display-name', displayName);
  };

  setTeam(team: string) {
    this.data.team = team;
    this.localStorage.set('team', team);
  };

  setFriendCode(friendCode: string) {
    this.data.friend_code = friendCode;
    this.localStorage.set('friend-code', friendCode);
  };

  setRadius(radius: number) {
    this.data.radius = radius;
    this.localStorage.set('radius', radius);
  };

  setFriends(friends: any[]) {
    this.data.friends = friends;
  };

  setCoordinates(coordinates: number[]) {
    this.data.coordinates.latitude = coordinates[0];
    this.data.coordinates.longitude = coordinates[1];
  };

  setLatitude(lat: number) {
    this.data.coordinates.latitude = Number(lat);
    this.localStorage.set('latitude', lat);
  };


  setLongitude(long: number) {
    this.data.coordinates.longitude = Number(long);
    this.localStorage.set('longitude', long);
  };

  setBlockList(blockList: any[]) {
    this.data.block_list = blockList;
  };

  setIsBlockListStale(isStale: boolean) {
    this.data.is_block_list_stale = isStale;
  };

  setIsFriendListStale(isStale: boolean) {
    this.data.is_friend_list_stale = isStale;
  };

  getId(): string {
    if (this.data.id === null && this.localStorage.get('user-id') !== null) {
      return this.localStorage.get('user-id');
    }
    return this.data.id;
  };

  getDisplayName(): string {
    if (this.data.display_name === null && this.localStorage.get('display-name') !== null) {
      return this.localStorage.get('display-name');
    }
    return this.data.display_name;
  };

  getTeam(): string {
    if (this.data.team === null && this.localStorage.get('team') !== null) {
      return this.localStorage.get('team');
    }
    return this.data.team;
  };

  getFriendCode(): string {
    if (this.data.friend_code === null && this.localStorage.get('friend-code') !== null) {
      return this.localStorage.get('friend-code');
    }
    return this.data.friend_code;
  };

  getRadius(): number {
    if (this.data.radius === null && this.localStorage.get('radius') !== null) {
      return parseInt(this.localStorage.get('radius'), 10);
    }
    return this.data.radius === null ? this.DEFAULT_RADIUS : Number(this.data.radius);
  };

  getFriends(): any[] {
    return this.data.friends;
  };

  getLatitude(): number {
    if (this.data.latitude === null && this.localStorage.get('latitude') !== null) {
      return +this.localStorage.get('latitude').toFixed(this.EXACT_PRECISION);
    }
    return +this.data.coordinates.latitude.toFixed(this.EXACT_PRECISION);
  };

  getLongitude(): number {
    if (this.data.longitude === null && this.localStorage.get('longitude') !== null) {
      return +this.localStorage.get('longitude').toFixed(this.EXACT_PRECISION);
    }
    return +this.data.coordinates.longitude.toFixed(this.EXACT_PRECISION);
  };

  getFuzzyLatitude(): number {
    if (this.data.latitude === null && this.localStorage.get('latitude') !== null) {
      return +this.localStorage.get('fuzzy-latitude').toFixed(this.FUZZY_PRECISION);
    }
    return +this.data.coordinates.latitude.toFixed(this.FUZZY_PRECISION);
  };

  getFuzzyLongitude(): number {
    if (this.data.longitude === null && this.localStorage.get('longitude') !== null) {
      return +this.localStorage.get('fuzzy-longitude').toFixed(this.FUZZY_PRECISION);
    }
    return +this.data.coordinates.longitude.toFixed(this.FUZZY_PRECISION);
  };

  getBlockList(): any[] {
    return this.data.block_list;
  };

  getIsBlockListStale(): boolean {
    return this.data.is_block_list_stale;
  };

  getIsFriendListStale(): boolean {
    return this.data.is_friend_list_stale;
  };
}

