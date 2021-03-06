interface Job {
    key: string | number;
    // eslint-disable-next-line
    func: () => Promise<any>;
    running: boolean;
    // eslint-disable-next-line
    resolve: (result: any) => void;
    reject: (error: Error) => void;
}

class Queue {
    private jobs: Job[];
    private concurrent: number;

    constructor(concurrent = 1) {
        this.jobs = [];
        this.concurrent = concurrent;
    }

    public execute<T>(func: () => Promise<T>, key: string | number = null): Promise<T> {
        return new Promise((resolve, reject): void =>  {
            this.jobs.push({key, func, running: false, resolve, reject});
            this.executeNext();
        });
    }

    private async executeNext(): Promise<void> {
        const job = this.getNext();

        if (job) {
            job.running = true;

            try {
                const result = await job.func();
                this.jobs.splice(this.jobs.indexOf(job), 1);
                job.resolve(result);
                this.executeNext();
            } catch (error) {
                this.jobs.splice(this.jobs.indexOf(job), 1);
                job.reject(error);
                this.executeNext();
            }
        }
    }

    private getNext(): Job {
        if (this.jobs.filter((j) => j.running).length > (this.concurrent - 1)) {
            return null;
        }

        for (let i = 0; i < this.jobs.length; i++) {
            const job = this.jobs[i];

            if (!job.running && (!job.key || !this.jobs.find((j) => j.key === job.key && j.running))) {
                return job;
            }
        }

        return null;
    }

    public clear(): void {
        this.jobs = [];
    }
}

export default Queue;