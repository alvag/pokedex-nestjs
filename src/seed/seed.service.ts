import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PokeResponse } from './interfaces/poke-response';
import { Pokemon } from '../pokemon/entities/pokemon.entity';
import { AxiosAdapter } from '../common/adapters/axios.adapter';

@Injectable()
export class SeedService {
    constructor(
        @InjectModel('Pokemon') private readonly pokemonModel: Model<Pokemon>,
        private http: AxiosAdapter,
    ) {}

    async executeSeed() {
        const data = await this.http.get<PokeResponse>(
            'https://pokeapi.co/api/v2/pokemon?limit=650',
        );

        await this.pokemonModel.deleteMany();

        const pokemonToInsert: { name: string; no: number }[] = [];

        data.results.forEach(({ name, url }) => {
            const segments = url.split('/');
            const no: number = +segments[segments.length - 2];
            pokemonToInsert.push({ no, name });
        });

        await this.pokemonModel.insertMany(pokemonToInsert);

        return 'Seed executed';
    }
}
