export interface clientLogoModel {
  id:any,
  title:any,
  count:any,
  images: Array<{
    image?: Array<{
      img?: string;
    }>;
  }>;
}
