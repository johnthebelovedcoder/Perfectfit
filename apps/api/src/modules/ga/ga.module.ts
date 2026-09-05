import { Module } from "@nestjs/common";
import { GaController } from "./ga.controller";
import { GaService } from "./ga.service";

@Module({
  controllers: [GaController],
  providers: [GaService],
})
export class GaModule {}
