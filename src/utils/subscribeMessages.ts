export const SUBSCRIBE_SUCCESS_MESSAGE =
  "Votre inscription a bien été enregistrée. Retrouvez l'activité dans votre planning et dans la section « À venir ».";

export function shouldOfferCarpoolAfterSubscribe(activity: { locationType: string }): boolean {
  return activity.locationType === "OFF_SITE";
}
