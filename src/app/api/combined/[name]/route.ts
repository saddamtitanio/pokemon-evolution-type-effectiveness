import type { NextApiRequest, NextApiResponse } from 'next';
import { driver } from '@/src/lib/neo4j';
import clientPromise from '@/src/lib/mongodb'