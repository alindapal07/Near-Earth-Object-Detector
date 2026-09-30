/**
 * CrossModeDispatcher.js — Universal Cross-System Action Dispatcher (Part 30)
 *
 * Connects Space Data Factory actions directly to existing subsystems:
 * • Solar System 3D Camera focus & follow
 * • Object Intelligence panel drawer
 * • Observatory Mode transition & tracking
 * • Comparison Modal multi-object comparison
 * • Mission Planner Modal route prepopulation
 * • SimulationClock date seeking for celestial events
 */

import { j2000DaysToDate } from '../utils/dateUtils';

export class CrossModeDispatcher {
  /**
   * Focuses 3D camera on selected object in Solar System
   */
  static focusObject(obj, solarSystemRef, onSelectObject) {
    if (!obj) return;
    if (onSelectObject) onSelectObject(obj);
    if (solarSystemRef?.current?.focusOnObject) {
      solarSystemRef.current.focusOnObject(obj.id || obj.spkid);
    }
  }

  /**
   * Enables camera tracking follow on object
   */
  static followObject(obj, solarSystemRef, onSelectObject) {
    if (!obj) return;
    this.focusObject(obj, solarSystemRef, onSelectObject);
    if (solarSystemRef?.current?.setFollowObject) {
      solarSystemRef.current.setFollowObject(true);
    }
  }

  /**
   * Switches to Observatory Mode and focuses target object
   */
  static observeObject(obj, onModeChange, onSelectObject) {
    if (onSelectObject && obj) onSelectObject(obj);
    if (onModeChange) onModeChange('OBSERVATORY');
  }

  /**
   * Opens Two-Object Comparison Modal with prepopulated objects
   */
  static compareObjects(objA, objB = null, onOpenCompare) {
    if (onOpenCompare) {
      onOpenCompare(objA, objB);
    }
  }

  /**
   * Opens Mission Planning system preselected with origin and destination
   */
  static planMission(originObj, destObj = null, onOpenPlanner) {
    if (onOpenPlanner) {
      onOpenPlanner(originObj, destObj);
    }
  }

  /**
   * Highlights 3D orbit line in scene
   */
  static showOrbit(obj, solarSystemRef) {
    if (solarSystemRef?.current?.showTrajectoryForAsteroid && obj) {
      solarSystemRef.current.showTrajectoryForAsteroid(obj);
    }
  }

  /**
   * Seeks SimulationClock to celestial event date and switches mode
   */
  static viewEvent(eventData, seekToDate, seekToDays, onModeChange) {
    if (!eventData) return;
    
    if (eventData.simTimeDays != null && seekToDays) {
      seekToDays(eventData.simTimeDays);
    } else if (eventData.date && seekToDate) {
      seekToDate(new Date(eventData.date));
    }

    if (eventData.mode && onModeChange) {
      onModeChange(eventData.mode);
    }
  }
}
