import type { CoachStep } from '../components/Coachmark'

/** Étapes de la visite guidée de chaque onglet, déclenchée au premier passage. */
export const TOURS: Record<string, CoachStep[]> = {
  calendar: [
    { target: '.calendar-grid', textKey: 'tour.calendar.1' },
    { target: '.calendar-key', textKey: 'tour.calendar.2' },
  ],
  diary: [
    { target: '.day-nav', textKey: 'tour.diary.1' },
    { target: '.summary', textKey: 'tour.diary.2' },
    { target: '.label-with-note .icon-btn', textKey: 'tour.diary.3' },
  ],
  add: [
    { target: 'input[name="food-search"]', textKey: 'tour.add.1' },
    { target: '.list-head-actions button:first-child', textKey: 'tour.add.2' },
  ],
  'add.custom': [
    { target: '#cf-name', textKey: 'tour.addCustom.1' },
    { target: '#cf-recipe-btn', textKey: 'tour.addCustom.2' },
    { target: '#cf-kcal', textKey: 'tour.addCustom.3' },
  ],
  'add.target': [
    { target: '#target-category', textKey: 'tour.addTarget.1' },
    { target: '#target-quantity', textKey: 'tour.addTarget.2' },
    { target: '.target-result', textKey: 'tour.addTarget.3' },
  ],
  weight: [
    { target: '.track-chart', textKey: 'tour.weight.1' },
    { target: '.bmi-gauge', textKey: 'tour.weight.2' },
  ],
  fridge: [
    { target: '#fridge-search', textKey: 'tour.fridge.1' },
    { target: '.recipe-line', textKey: 'tour.fridge.2' },
  ],
  profile: [{ target: '#tutorials-toggle', textKey: 'tour.profile.1' }],
}
