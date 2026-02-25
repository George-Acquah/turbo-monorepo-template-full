export * from './prisma.module';

//Everthing inside modules
export * from './modules';

//We fully remove prisma from exports to prevent leakage in the first place 
//I think that should be the benefit of implementing the DB adapters directly inside the prisma DB
// export * from './prisma.service';

//I dont think know if this should still be commented though
// export * from '../generated/prisma';
export * from './constants/table-names';
